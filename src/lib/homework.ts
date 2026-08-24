import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { WEEKDAYS_MON_FRI, weekdayNameOf } from "./week";

/**
 * Avlesing av lekseplaner.
 *
 * En lekseplan er en tabell over fag, ikke over dager. Bare noen få rader sier
 * hvilken dag leksa hører til («Gjør utdelt ark ferdig til fredag»), og over
 * halvparten har ingen lekser i det hele tatt — bare tema. Derfor plukker vi ut
 * radene som faktisk har lekser, og lar dagen stå åpen når planen ikke sier noe.
 * Et menneske velger dagen etterpå.
 */

/** Sendes som dag når planen ikke sier hvilken dag leksa hører til. */
export const NO_DAY = "ukjent";

const DAY_NAMES = WEEKDAYS_MON_FRI.map(weekdayNameOf);

export type HomeworkRow = {
  /** Faget raden kom fra: «Matte», «Tysk». */
  subject: string;
  /** Selve leksa, ordrett fra planen. */
  task: string;
  /** 1 = mandag ... 5 = fredag, eller null når planen ikke sier noe. */
  weekday: number | null;
};

const SYSTEM = `Du leser lekseplaner fra norsk skole og trekker ut leksene.

En lekseplan er som regel en tabell med fag på hver rad. Kolonnene heter gjerne
FAG, TEMA og LEKSER, men navnene varierer, og noen planer har bare fritekst.

Ta med en rad bare når den beskriver noe eleven skal gjøre hjemme. Rader som
bare beskriver hva klassen jobber med i timene er tema, ikke lekser, og skal
utelates. «Ingen lekser denne uka» er heller ikke en lekse.

Gjengi leksa ordrett slik den står i planen. Ikke omskriv, forkort eller legg
til noe. Behold nynorsk og skrivefeil som de er.

Dagen settes bare når planen selv sier den — «til fredag», «gjøres til onsdag»,
«innen torsdag». Ikke gjett ut fra faget, timeplanen eller hva som virker
rimelig. Står det ingen dag, sett "${NO_DAY}".`;

const SCHEMA = {
  type: "object",
  properties: {
    lekser: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fag: {
            type: "string",
            description: "Faget raden står under, for eksempel «Matte».",
          },
          lekse: {
            type: "string",
            description: "Leksa ordrett fra planen.",
          },
          dag: {
            type: "string",
            enum: [...DAY_NAMES, NO_DAY],
            description: `Dagen planen oppgir, ellers "${NO_DAY}".`,
          },
        },
        required: ["fag", "lekse", "dag"],
        additionalProperties: false,
      },
    },
  },
  required: ["lekser"],
  additionalProperties: false,
} as const;

export type Extraction = { rows: HomeworkRow[]; raw: string };

/**
 * Leser en opplastet plan. Bildet sendes som det er — planene er tette tabeller
 * der oppløsning er forskjellen på riktig og nesten riktig avlesing.
 */
export async function readHomeworkPlan(
  file: { data: string; mediaType: string },
): Promise<Extraction> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Mangler ANTHROPIC_API_KEY. Se README for hvordan du legger den inn.",
    );
  }

  const client = new Anthropic();

  const source =
    file.mediaType === "application/pdf"
      ? ({
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: file.data,
          },
        })
      : ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: file.mediaType as "image/jpeg" | "image/png",
            data: file.data,
          },
        });

  const response = await client.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM,
    // Å lese en tabell er ikke et tenkekrevende problem. Lavere innsats gir
    // samme svar for under halve prisen.
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    // Sikkerhetsfiltrene kommer aldri til å slå ut på en lekseplan, men et
    // avslag skal gi en lesbar feil og ikke en krasj.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [
      {
        role: "user",
        content: [source, { type: "text", text: "Trekk ut leksene fra denne planen." }],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Modellen ville ikke lese denne fila. Prøv et annet bilde.");
  }

  const text = response.content.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Fikk ikke noe svar å tolke.");

  return { rows: parseRows(text), raw: text };
}

/**
 * Strukturerte svar er skjemavaliderte, men svaret kommer likevel som tekst
 * over nettverket. Vi tolker forsiktig framfor å stole blindt på formen.
 */
export function parseRows(text: string): HomeworkRow[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Kunne ikke tolke svaret fra modellen.");
  }

  const lekser = (parsed as { lekser?: unknown })?.lekser;
  if (!Array.isArray(lekser)) throw new Error("Svaret manglet lekser.");

  return lekser.flatMap((entry): HomeworkRow[] => {
    const row = entry as { fag?: unknown; lekse?: unknown; dag?: unknown };
    const subject = typeof row.fag === "string" ? row.fag.trim() : "";
    const task = typeof row.lekse === "string" ? row.lekse.trim() : "";
    if (!task) return [];

    const dayIndex = DAY_NAMES.indexOf(
      typeof row.dag === "string" ? row.dag.trim().toLowerCase() : "",
    );

    return [
      {
        subject: subject.slice(0, 60),
        task: task.slice(0, 1000),
        weekday: dayIndex === -1 ? null : WEEKDAYS_MON_FRI[dayIndex],
      },
    ];
  });
}

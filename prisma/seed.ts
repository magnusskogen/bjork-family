import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES, FAMILY } from "../src/lib/family";

const prisma = new PrismaClient();

async function main() {
  // Kategorier først — beskjeder peker på dem.
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.noticeCategory.findUnique({
      where: { id: category.id },
    });
    if (existing) {
      console.log(`Kategorien ${category.name} finnes allerede`);
      continue;
    }
    await prisma.noticeCategory.create({ data: { ...category } });
    console.log(`La til kategorien ${category.name}`);
  }

  for (const person of FAMILY) {
    const existing = await prisma.member.findFirst({
      where: { name: person.name },
    });

    if (existing) {
      if (existing.isChild !== person.isChild) {
        await prisma.member.update({
          where: { id: existing.id },
          data: { isChild: person.isChild },
        });
        console.log(`Oppdaterte ${person.name}`);
      } else {
        console.log(`${person.name} finnes allerede`);
      }
      continue;
    }

    await prisma.member.create({ data: { ...person } });
    console.log(`La til ${person.name}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

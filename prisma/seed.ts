import { PrismaClient } from "@prisma/client";
import { FAMILY } from "../src/lib/family";

const prisma = new PrismaClient();

async function main() {
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

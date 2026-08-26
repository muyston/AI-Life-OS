import ical from "node-ical";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const icalUrl = "https://calendar.google.com/calendar/ical/grarranz%40gmail.com/public/basic.ics";

async function testSync() {
  console.log("Iniciando sincronizacion con el feed real de Google Calendar...");
  console.log("URL:", icalUrl);

  const webEvents = await ical.async.fromURL(icalUrl);
  let count = 0;

  for (const key in webEvents) {
    if (!Object.prototype.hasOwnProperty.call(webEvents, key)) continue;
    const ev = webEvents[key];

    if (ev.type === "VEVENT" && ev.start && ev.end) {
      const externalId = ev.uid || key;
      const summary = ev.summary || "Evento sin titulo";
      const description = ev.description ? String(ev.description) : null;
      const location = ev.location ? String(ev.location) : null;
      const startTime = new Date(ev.start);
      const endTime = new Date(ev.end);
      const isAllDay = ev.datetype === "date" || (endTime.getTime() - startTime.getTime()) >= 86400000;

      await prisma.calendarEvent.upsert({
        where: { externalId },
        update: {
          summary,
          description,
          startTime,
          endTime,
          isAllDay,
          location,
          status: "CONFIRMED",
          syncedAt: new Date(),
        },
        create: {
          externalId,
          summary,
          description,
          startTime,
          endTime,
          isAllDay,
          location,
          status: "CONFIRMED",
          syncedAt: new Date(),
        },
      });
      count++;
    }
  }

  console.log(`\nSincronizacion completada con exito.`);
  console.log(`Total de eventos sincronizados de Google Calendar: ${count}`);

  const totalInDb = await prisma.calendarEvent.count();
  console.log(`Total de eventos persistidos en SQLite dev.db: ${totalInDb}`);

  const sample = await prisma.calendarEvent.findMany({
    take: 5,
    orderBy: { startTime: "desc" },
  });

  sample.forEach((s, idx) => {
    console.log(`   [${idx + 1}] "${s.summary}" | Inicio: ${s.startTime.toISOString()}`);
  });
}

testSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

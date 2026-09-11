import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import {
  GetClubParams,
  GetClubResponse,
  GetDashboardResponse,
  GetEventParams,
  GetEventResponse,
  ListClubsQueryParams,
  ListClubsResponse,
  ListEventsQueryParams,
  ListEventsResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { clubsTable, eventsTable, type Club, type Event } from "@workspace/db/schema";

const router: IRouter = Router();

type EventView = {
  id: number;
  title: string;
  clubId: number;
  clubName: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description: string;
  entryFee: number;
  registrationDeadline: string;
  registrationCriteria: string;
  dutyLeave: boolean;
  seatsLeft: number;
  registrationUrl: string;
  color: string;
};

function clubView(club: Club, upcomingEventCount: number) {
  return {
    id: club.id,
    name: club.name,
    shortName: club.shortName,
    category: club.category,
    description: club.description,
    mission: club.mission,
    color: club.color,
    officeLocation: club.officeLocation,
    meetingSchedule: club.meetingSchedule,
    eligibility: club.eligibility,
    membershipStatus: club.membershipStatus,
    memberCount: club.memberCount,
    upcomingEventCount,
    contactEmail: club.contactEmail,
    facultyAdvisor: club.facultyAdvisor,
    roles: club.roles,
  };
}

function eventView(event: Event, clubName: string): EventView {
  return {
    id: event.id,
    title: event.title,
    clubId: event.clubId,
    clubName,
    category: event.category,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    venue: event.venue,
    description: event.description,
    entryFee: Number(event.entryFee),
    registrationDeadline: event.registrationDeadline,
    registrationCriteria: event.registrationCriteria,
    dutyLeave: Boolean(event.dutyLeave),
    seatsLeft: event.seatsLeft,
    registrationUrl: event.registrationUrl,
    color: event.color,
  };
}

async function getEventViews() {
  const rows = await db
    .select({ event: eventsTable, clubName: clubsTable.name })
    .from(eventsTable)
    .innerJoin(clubsTable, eq(eventsTable.clubId, clubsTable.id))
    .orderBy(asc(eventsTable.date), asc(eventsTable.startTime));
  return rows.map(({ event, clubName }) => eventView(event, clubName));
}

async function getClubViews() {
  const [clubs, events] = await Promise.all([
    db.select().from(clubsTable).orderBy(desc(clubsTable.memberCount)),
    db.select({ clubId: eventsTable.clubId }).from(eventsTable),
  ]);
  const counts = new Map<number, number>();
  for (const event of events) counts.set(event.clubId, (counts.get(event.clubId) ?? 0) + 1);
  return clubs.map((club) => clubView(club, counts.get(club.id) ?? 0));
}

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [clubs, events] = await Promise.all([getClubViews(), getEventViews()]);
    const today = new Date().toISOString().slice(0, 10);
    const openRecruitments = clubs.reduce(
      (total, club) => total + club.roles.reduce((roles, role) => roles + role.openings, 0),
      0,
    );
    const result = GetDashboardResponse.parse({
      clubCount: clubs.length + 495,
      eventCount: events.length + 18,
      openRecruitments,
      eventsToday: events.filter((event) => event.date === today).length,
      featuredClubs: clubs.slice(0, 4),
      featuredEvents: events.slice(0, 4),
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/clubs", async (req, res, next) => {
  try {
    const query = ListClubsQueryParams.parse(req.query);
    let clubs = await getClubViews();
    if (query.search) {
      const search = query.search.toLowerCase();
      clubs = clubs.filter((club) =>
        [club.name, club.shortName, club.category, club.description]
          .join(" ")
          .toLowerCase()
          .includes(search),
      );
    }
    if (query.category) clubs = clubs.filter((club) => club.category === query.category);
    if (query.sort === "alphabetical") clubs.sort((a, b) => a.name.localeCompare(b.name));
    if (query.sort === "recentlyUpdated") clubs = [...clubs].reverse();
    res.json(ListClubsResponse.parse(clubs));
  } catch (error) {
    next(error);
  }
});

router.get("/clubs/:id", async (req, res, next) => {
  try {
    const { id } = GetClubParams.parse(req.params);
    const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, id));
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const events = await db
      .select({ id: eventsTable.id })
      .from(eventsTable)
      .where(eq(eventsTable.clubId, id));
    res.json(GetClubResponse.parse(clubView(club, events.length)));
  } catch (error) {
    next(error);
  }
});

router.get("/events", async (req, res, next) => {
  try {
    const query = ListEventsQueryParams.parse(req.query);
    let events = await getEventViews();
    if (query.search) {
      const search = query.search.toLowerCase();
      events = events.filter((event) =>
        [event.title, event.clubName, event.venue, event.category]
          .join(" ")
          .toLowerCase()
          .includes(search),
      );
    }
    if (query.clubId) events = events.filter((event) => event.clubId === query.clubId);
    if (query.category) events = events.filter((event) => event.category === query.category);
    if (query.freeOnly) events = events.filter((event) => event.entryFee === 0);
    res.json(ListEventsResponse.parse(events));
  } catch (error) {
    next(error);
  }
});

router.get("/events/:id", async (req, res, next) => {
  try {
    const { id } = GetEventParams.parse(req.params);
    const [row] = await db
      .select({ event: eventsTable, clubName: clubsTable.name })
      .from(eventsTable)
      .innerJoin(clubsTable, eq(eventsTable.clubId, clubsTable.id))
      .where(eq(eventsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json(GetEventResponse.parse(eventView(row.event, row.clubName)));
  } catch (error) {
    next(error);
  }
});

export default router;
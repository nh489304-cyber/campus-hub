import { integer, jsonb, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type ClubRole = {
  title: string;
  responsibility: string;
  openings: number;
};

export const clubsTable = pgTable("campus_clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  mission: text("mission").notNull(),
  color: text("color").notNull(),
  officeLocation: text("office_location").notNull(),
  meetingSchedule: text("meeting_schedule").notNull(),
  eligibility: text("eligibility").notNull(),
  membershipStatus: text("membership_status").notNull(),
  memberCount: integer("member_count").notNull(),
  contactEmail: text("contact_email").notNull(),
  facultyAdvisor: text("faculty_advisor").notNull(),
  roles: jsonb("roles").$type<ClubRole[]>().notNull(),
});

export const eventsTable = pgTable("campus_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  clubId: integer("club_id").notNull().references(() => clubsTable.id),
  category: text("category").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  venue: text("venue").notNull(),
  description: text("description").notNull(),
  entryFee: numeric("entry_fee", { precision: 10, scale: 2 }).notNull(),
  registrationDeadline: text("registration_deadline").notNull(),
  registrationCriteria: text("registration_criteria").notNull(),
  dutyLeave: integer("duty_leave").notNull(),
  seatsLeft: integer("seats_left").notNull(),
  registrationUrl: text("registration_url").notNull(),
  color: text("color").notNull(),
});

export const insertClubSchema = createInsertSchema(clubsTable);
export const insertEventSchema = createInsertSchema(eventsTable);
export type Club = typeof clubsTable.$inferSelect;
export type Event = typeof eventsTable.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
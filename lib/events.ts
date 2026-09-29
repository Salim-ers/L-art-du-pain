import type { Event } from "@/lib/db/schema";
import { dateRange } from "@/lib/dates";

export type CampaignState = "draft" | "upcoming" | "open" | "closed" | "full";

/** Dates de retrait autorisées par une campagne (liste explicite, sinon toute la plage). */
export function campaignDates(e: Pick<Event, "pickupDates" | "pickupStart" | "pickupEnd">) {
  if (e.pickupDates.length) return [...e.pickupDates].sort();
  if (e.pickupStart && e.pickupEnd) return dateRange(e.pickupStart, e.pickupEnd);
  return [];
}

export function campaignState(e: Event, orderCount: number, now = new Date()): CampaignState {
  if (!e.published) return "draft";
  if (e.orderOpensAt && now < e.orderOpensAt) return "upcoming";
  if (e.orderClosesAt && now > e.orderClosesAt) return "closed";
  if (e.maxOrders !== null && orderCount >= e.maxOrders) return "full";
  return "open";
}

export const campaignStateLabel: Record<CampaignState, string> = {
  draft: "Brouillon",
  upcoming: "Bientôt ouvert",
  open: "Précommandes ouvertes",
  closed: "Précommandes terminées",
  full: "Complet",
};

import { z } from "zod";

const id = z.number().int().min(1).max(2147483647);
export const notificationReadSchema = z.union([
  z.object({ id }).strict(),
  z.object({ throughId: id }).strict(),
]);
export type NotificationRead = z.infer<typeof notificationReadSchema>;
export type LineupNotification = {
  id: number;
  lineupId: number;
  name: string;
  href: string;
  createdAt: Date | string;
  read: boolean;
  fields: string[];
};
export type NotificationPage = {
  items: LineupNotification[];
  unreadCount: number;
  latestId: number | null;
  nextCursor: number | null;
};

import { requirePageAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Mini Heroes Library is a place to explore heroes, build teams, and share lineup ideas for Mini Heroes: Magic Throne. Created by ✨Cmajor✨.",
};

export default async function AboutPage() {
  await requirePageAccess();
  return <AboutContent />;
}

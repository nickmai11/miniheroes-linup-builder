"use client";

import Image from "next/image";
import type { CoreWithSkill } from "@/lib/build-types";
import { SKILL_KIND_LABELS } from "@/lib/hero-labels";
import { versioned } from "@/lib/asset-version";

export function CoreDetails({ core }: { core: CoreWithSkill }) {
  const skill = core.skill;
  return (
    <div className="flex flex-col gap-3 text-left">
      <div>
        <h4 className="font-semibold">{core.name}</h4>
        <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
          {core.description}
        </p>
      </div>
      {skill ? (
        <div className="border-t pt-3">
          <div className="mb-2 flex items-center gap-2">
            {skill.iconUrl && (
              <Image
                src={versioned(skill.iconUrl)}
                alt=""
                width={40}
                height={40}
                className="rounded"
              />
            )}
            <div>
              <p className="text-primary text-xs">
                {SKILL_KIND_LABELS[skill.kind]}
                {skill.unlockStars !== null
                  ? ` · ${skill.unlockStars === 0 ? "Start" : `${skill.unlockStars}★`}`
                  : ""}
              </p>
              <h5 className="text-sm font-semibold">{skill.name}</h5>
            </div>
          </div>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {skill.description}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Linked skill not recorded yet.
        </p>
      )}
    </div>
  );
}

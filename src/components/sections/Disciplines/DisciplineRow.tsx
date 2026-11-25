"use client";

import Link from "next/link";
import type { Route } from "next";
import { useId, useState, useSyncExternalStore } from "react";
import type { Discipline } from "@/lib/disciplines";
import type { ProjectImage, SiteImage } from "@/lib/content.schema";
import { SmartImage } from "@/components/ui/SmartImage";
import styles from "./Disciplines.module.css";

type Props = {
  discipline: Discipline;
  image: ProjectImage | SiteImage | null;
};

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** Mirrors the stacked-layout media query in Disciplines.module.css. */
const STACKED = "(max-width: 79.98rem), (hover: none)";
const subscribeStacked = (cb: () => void) => {
  const mq = window.matchMedia(STACKED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getStacked = () => window.matchMedia(STACKED).matches;

/**
 * One discipline row / column. The whole row is a link to the service. On the stacked layout the blurb
 * collapses after hydration behind a toggle with aria-expanded; on the column layout (a hovering pointer
 * at ≥ 80rem) CSS opens it on hover / focus. Both are grid-template-rows transitions in
 * Disciplines.module.css: no JS animation. Without JS everything is visible and the toggle is hidden.
 */
export function DisciplineRow({ discipline: d, image }: Props) {
  // false on the server and the hydrating render, true afterwards: never a markup mismatch.
  const hydrated = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  // Only the stacked accordion hides its closed panels from assistive technology: on the column layout
  // the blurb is revealed by hover / focus on the link that contains it, and must stay readable.
  const stacked = useSyncExternalStore(subscribeStacked, getStacked, getServerSnapshot);
  const [expanded, setExpanded] = useState(false);
  const toggleId = useId();
  const panelId = `discipline-${d.id}-panel`;

  return (
    <li
      className={styles.col}
      data-reveal="col"
      data-accordion={hydrated ? "" : undefined}
      data-expanded={hydrated ? String(expanded) : undefined}
    >
      <Link href={`/services#${d.id}` as Route} className={styles.link}>
        <SmartImage
          image={image}
          // Decorative here: the link's name is its own visible label and blurb.
          alt=""
          sizes="(min-width: 80rem) 50vw, 100vw"
          className={styles.media}
          objectPosition={d.focus}
          placeholderTodo={`${d.label} discipline image`}
        />
        <div aria-hidden className={styles.scrim} />

        <div className={`${styles.content} p-3`}>
          <h3 className="font-display text-h3 text-bone xl:text-[clamp(1.625rem,1.95vw,2.125rem)]">
            {d.label}
          </h3>
          <div id={panelId} className={styles.panel} inert={stacked && !expanded}>
            <div className={styles.blurb}>
              <div className="max-w-[40ch] pt-1.5">
                <p className="text-body text-bone">{d.blurb}</p>
                {d.note ? <p className="mt-1.5 text-body text-bone">{d.note}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </Link>
      <button
        type="button"
        id={toggleId}
        className={styles.toggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={`${d.label} details`}
        onClick={() => setExpanded((v) => !v)}
      >
        <span aria-hidden className={styles.toggleIcon} />
      </button>
    </li>
  );
}

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
  index: number;
};

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * One discipline row / column. The whole row is a link to the service; the blurb sits in a panel next
 * to (≥ lg) or under (stacked) the label. After hydration, on the stacked (mobile / touch) layout the
 * panel collapses and a toggle button with aria-expanded opens it; the height is animated by a CSS
 * grid-template-rows transition (Disciplines.module.css) — no JS animation. Collapsed panels are
 * `inert`. Without JS, or on the column layout, everything is visible and the toggle is hidden.
 */
export function DisciplineRow({ discipline: d, image, index }: Props) {
  // false on the server and the hydrating render, true afterwards — never a markup mismatch.
  const hydrated = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const [expanded, setExpanded] = useState(false);
  const toggleId = useId();
  const labelId = `discipline-${d.id}-label`;
  const panelId = `discipline-${d.id}-panel`;
  const collapsed = hydrated && !expanded;

  return (
    <li
      className={styles.col}
      data-reveal="col"
      data-accordion={hydrated ? "" : undefined}
      data-expanded={hydrated ? String(expanded) : undefined}
    >
      <Link href={`/services#${d.id}` as Route} className={styles.link} aria-labelledby={labelId} data-cursor="Open">
        <SmartImage
          image={image}
          sizes="(min-width: 64rem) 50vw, 100vw"
          className={styles.media}
          placeholderTodo={`${d.label} discipline image — pending image pipeline`}
        />
        <div aria-hidden className={styles.scrim} />

        <div className={`${styles.content} p-3 lg:p-4`}>
          <div className={styles.label}>
            <span aria-hidden className="eyebrow text-brass">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 id={labelId} className="font-display text-h2 text-bone">
              {d.label}
            </h3>
          </div>
          {/* `inert` only bites on the stacked layout, where .panel is collapsed; on columns it is display-free. */}
          <div id={panelId} className={styles.panel} inert={collapsed ? true : undefined}>
            <div className={styles.blurb}>
              <div className="pt-2 lg:pt-0">
                <p className="text-body text-bone">{d.blurb}</p>
                {d.note ? <p className="mt-1 text-small text-sand">{d.note}</p> : null}
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

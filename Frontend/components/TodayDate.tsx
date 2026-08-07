"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

let cachedLabel = "";

/** Client-only: computed lazily once, so it is fresh instead of frozen at build time. */
function getSnapshot(): string {
  if (!cachedLabel) {
    cachedLabel = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return cachedLabel;
}

export default function TodayDate() {
  const label = useSyncExternalStore(emptySubscribe, getSnapshot, () => "");

  return <p className="mt-2 text-slate-500">{label || "\u00A0"}</p>;
}

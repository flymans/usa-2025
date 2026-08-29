"use client";

import { useState } from "react";
import { JourneyMap } from "./components/journey-map";
import { stops } from "./data/journey-stops";

export function UsaJourney() {
  const [activeId, setActiveId] = useState(stops[0].id);
  const active = stops.find((stop) => stop.id === activeId) ?? stops[0];

  return (
    <main className="journey">
      <header className="masthead">
        <div>
          <div className="eyebrow">Архив путешествия · 2025</div>
          <h1 className="title">Америка</h1>
        </div>
        <div className="counter">6 октября — 3 ноября</div>
      </header>
      <JourneyMap stops={stops} active={active} onSelect={setActiveId} />
      <footer className="footnote">
        <span>Нажмите на точку маршрута</span>
      </footer>
    </main>
  );
}

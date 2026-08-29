import type { Stop } from "../types/journey";

export function StoryCard({ stop }: { stop: Stop }) {
  return (
    <aside className="storyCard" aria-live="polite">
      <div className="storyIndex">Остановка {stop.number}</div>
      <h2>{stop.title}</h2>
      <p>{stop.note}</p>
    </aside>
  );
}

export type Stop = {
  id: string;
  number: string;
  title: string;
  note: string;
  coordinates: [number, number];
  role?: "start" | "finish";
  markerOffset?: [number, number];
};

export type HoveredState = { name: string; x: number; y: number } | null;
export type StatePath = { id: string; name: string; path: string };
export type MapTransform = { scale: number; x: number; y: number };

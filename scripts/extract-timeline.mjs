import { readFileSync, writeFileSync } from "node:fs";

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  console.error("Usage: node scripts/extract-timeline.mjs <timeline.json> <output.ts>");
  process.exit(1);
}

const timeline = JSON.parse(readFileSync(input, "utf8"));
const from = "2025-10-06";
const until = "2025-11-04";
const pointPattern = /^(-?\d+(?:\.\d+)?)°,\s*(-?\d+(?:\.\d+)?)°$/;
const points = [];

for (const segment of timeline.semanticSegments ?? []) {
  for (const entry of segment.timelinePath ?? []) {
    if (entry.time < from || entry.time >= until) continue;
    const match = pointPattern.exec(entry.point);
    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    const isContinentalUs = latitude >= 24 && latitude <= 50 && longitude >= -125 && longitude <= -66;
    if (!isContinentalUs) continue;

    points.push({ time: entry.time, coordinates: [longitude, latitude] });
  }
}

points.sort((left, right) => left.time.localeCompare(right.time));
const coordinates = points.map((point) => point.coordinates);

const source = `// Generated from a private Google Timeline export. The original export is not committed.\n` +
  `// Continental US only, 2025-10-06 through 2025-11-03 inclusive.\n` +
  `export const routeCoordinates: ReadonlyArray<readonly [number, number]> = ${JSON.stringify(coordinates)};\n`;

writeFileSync(output, source);
console.log(`Wrote ${coordinates.length} GPS points to ${output}`);

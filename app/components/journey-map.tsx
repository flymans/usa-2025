"use client";

import { useEffect, useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import states from "us-atlas/states-10m.json";
import { stateNames } from "../data/state-names";
import { useMapNavigation } from "../hooks/use-map-navigation";
import type { HoveredState, StatePath, Stop } from "../types/journey";
import { MapControls } from "./map-controls";
import { StoryCard } from "./story-card";

type JourneyMapProps = {
  stops: Stop[];
  active: Stop;
  onSelect: (id: string) => void;
};

export function JourneyMap({ stops, active, onSelect }: JourneyMapProps) {
  const [hoveredState, setHoveredState] = useState<HoveredState>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<
    ReadonlyArray<readonly [number, number]>
  >([]);
  const navigation = useMapNavigation();

  useEffect(() => {
    const controller = new AbortController();
    const routeUrl = new URL("data/route-2025.json", window.location.href);

    fetch(routeUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Route request failed: ${response.status}`);
        return response.json() as Promise<Array<[number, number]>>;
      })
      .then(setRouteCoordinates)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to load route coordinates", error);
      });

    return () => controller.abort();
  }, []);

  const map = useMemo(() => {
    const projection = geoAlbersUsa().translate([600, 350]).scale(1300);
    const path = geoPath(projection);
    const topology = states as never;
    const geometries = (states as any).objects.states.geometries.filter(
      (item: any) => stateNames[String(item.id).padStart(2, "0")],
    );
    const stateFeatures = feature(topology, {
      type: "GeometryCollection",
      geometries,
    } as never) as any;
    const mainland = merge(topology, geometries) as any;

    return {
      statePaths: stateFeatures.features.map((item: any) => {
        const id = String(item.id).padStart(2, "0");
        return { id, name: stateNames[id] ?? id, path: path(item) ?? "" };
      }),
      nation: path(mainland) ?? "",
      positions: stops.map((stop) => projection(stop.coordinates) as [number, number]),
      routePositions: routeCoordinates.flatMap((coordinates) => {
        const position = projection([coordinates[0], coordinates[1]]);
        return position ? [position] : [];
      }),
    };
  }, [stops, routeCoordinates]);
  const routePath = `M ${map.routePositions.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")}`;
  const { transform } = navigation;

  return (
    <section className="mapStage" aria-label="Схема путешествия по США">
      <svg
        className="mapSvg"
        viewBox="80 55 1040 590"
        role="img"
        aria-labelledby="map-title map-description"
        {...navigation.svgHandlers}
      >
        <title id="map-title">Карта путешествия по США</title>
        <desc id="map-description">
          GPS-маршрут путешествия по континентальным США с девятнадцатью остановками.
        </desc>
        <g
          className={`mapViewport ${navigation.isAnimating ? "mapViewportAnimated" : ""}`}
          transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}
        >
          {map.statePaths.map((state: StatePath) => (
            <path
              className="state"
              d={state.path}
              key={state.id}
              onPointerEnter={(event) =>
                setHoveredState({ name: state.name, x: event.clientX, y: event.clientY })
              }
              onPointerMove={(event) =>
                setHoveredState({ name: state.name, x: event.clientX, y: event.clientY })
              }
              onPointerLeave={() => setHoveredState(null)}
            >
              <title>{state.name}</title>
            </path>
          ))}
          <path className="nationOutline" d={map.nation} aria-hidden="true" />
          <path className="routeHalo" d={routePath} aria-hidden="true" />
          <path className="route" d={routePath} aria-hidden="true" />
          {stops.map((stop, index) => {
            const [anchorX, anchorY] = map.positions[index];
            const [offsetX, offsetY] = stop.markerOffset ?? [0, 0];
            const x = anchorX + offsetX;
            const y = anchorY + offsetY;
            const selected = stop.id === active.id;

            return (
              <g
                className={`stop ${stop.role ? `stop-${stop.role}` : ""} ${selected ? "stopActive" : ""}`}
                key={stop.id}
                role="button"
                tabIndex={0}
                aria-label={`${stop.number}. ${stop.title}`}
                aria-pressed={selected}
                transform={`translate(${x} ${y}) scale(${1 / transform.scale})`}
                onClick={() => onSelect(stop.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(stop.id);
                  }
                }}
              >
                {stop.markerOffset && (
                  <line
                    className="stopLeader"
                    x1={-offsetX * transform.scale}
                    y1={-offsetY * transform.scale}
                    x2="0"
                    y2="0"
                  />
                )}
                <circle r="17" />
                {!stop.role && <text>{stop.number}</text>}
                {stop.role === "start" && (
                  <g className="raceIcon raceIconStart" aria-hidden="true">
                    <path d="M-6 9V-9M-6-8H7L3-3 7 2H-6" />
                  </g>
                )}
                {stop.role === "finish" && (
                  <g className="raceIcon raceIconFinish" aria-hidden="true">
                    <path className="flagPole" d="M-7 9V-9" />
                    <path className="flagOutline" d="M-7-8H7V3H-7Z" />
                    <path className="flagChecks" d="M-7-8H0V-2.5H-7ZM0-2.5H7V3H0Z" />
                  </g>
                )}
                {stop.role && (
                  <text className="stopRole" y="30">
                    {stop.role === "start" ? "СТАРТ" : "ФИНИШ"}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <MapControls scale={transform.scale} onZoom={navigation.zoomBy} onReset={navigation.reset} />
      {hoveredState && (
        <div
          className="stateTooltip"
          style={{ left: hoveredState.x + 14, top: hoveredState.y + 14 }}
        >
          {hoveredState.name}
        </div>
      )}
      <StoryCard stop={active} />
    </section>
  );
}

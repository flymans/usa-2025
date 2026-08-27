"use client";

import { useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import states from "us-atlas/states-10m.json";

type Stop = { id:string; number:string; title:string; note:string; coordinates:[number,number] };

const stops: Stop[] = [
  { id:"west", number:"01", title:"Первая остановка", note:"Здесь появится начало путешествия, дата и короткий фрагмент истории.", coordinates:[-122.42,37.77] },
  { id:"east", number:"02", title:"Следующая точка", note:"Демонстрационная остановка — позже заменим её фактическим местом из маршрута.", coordinates:[-74,40.71] },
];

const stateNames: Record<string,string> = {
  "01":"Алабама", "04":"Аризона", "05":"Арканзас", "06":"Калифорния", "08":"Колорадо",
  "09":"Коннектикут", "10":"Делавэр", "11":"Округ Колумбия", "12":"Флорида", "13":"Джорджия",
  "16":"Айдахо", "17":"Иллинойс", "18":"Индиана", "19":"Айова", "20":"Канзас", "21":"Кентукки",
  "22":"Луизиана", "23":"Мэн", "24":"Мэриленд", "25":"Массачусетс", "26":"Мичиган",
  "27":"Миннесота", "28":"Миссисипи", "29":"Миссури", "30":"Монтана", "31":"Небраска",
  "32":"Невада", "33":"Нью-Гэмпшир", "34":"Нью-Джерси", "35":"Нью-Мексико", "36":"Нью-Йорк",
  "37":"Северная Каролина", "38":"Северная Дакота", "39":"Огайо", "40":"Оклахома", "41":"Орегон",
  "42":"Пенсильвания", "44":"Род-Айленд", "45":"Южная Каролина", "46":"Южная Дакота",
  "47":"Теннесси", "48":"Техас", "49":"Юта", "50":"Вермонт", "51":"Вирджиния",
  "53":"Вашингтон", "54":"Западная Вирджиния", "55":"Висконсин", "56":"Вайоминг",
};

type HoveredState = { name:string; x:number; y:number } | null;
type StatePath = { id:string; name:string; path:string };

export function UsaJourney() {
  const [activeId,setActiveId] = useState(stops[0].id);
  const [hoveredState,setHoveredState] = useState<HoveredState>(null);
  const active = stops.find((stop) => stop.id === activeId) ?? stops[0];
  const map = useMemo(() => {
    const projection = geoAlbersUsa().translate([600,350]).scale(1450);
    const path = geoPath(projection);
    const topology = states as never;
    const geometries = (states as any).objects.states.geometries.filter((item:any) => stateNames[String(item.id).padStart(2,"0")]);
    const stateFeatures = feature(topology,{ type:"GeometryCollection", geometries } as never) as any;
    const mainland = merge(topology,geometries) as any;
    return {
      statePaths:stateFeatures.features.map((item:any) => {
        const id = String(item.id).padStart(2,"0");
        return { id, name:stateNames[id] ?? id, path:path(item) ?? "" };
      }),
      nation:path(mainland) ?? "",
      positions:stops.map((stop) => projection(stop.coordinates) as [number,number]),
    };
  },[]);
  const routePath = `M ${map.positions.map(([x,y]) => `${x} ${y}`).join(" L ")}`;

  return <main className="journey">
    <header className="masthead">
      <div><div className="eyebrow">Архив путешествия · 2025</div><h1 className="title">Америка</h1></div>
      <div className="counter">Маршрут · черновик 01</div>
    </header>
    <section className="mapStage" aria-label="Схема путешествия по США">
      <svg className="mapSvg" viewBox="80 55 1040 590" role="img" aria-labelledby="map-title map-description">
        <title id="map-title">Карта путешествия по США</title>
        <desc id="map-description">Черновая карта штатов с двумя демонстрационными остановками.</desc>
        <g>
          {map.statePaths.map((state:StatePath) => <path className="state" d={state.path} key={state.id}
            onPointerEnter={(event) => setHoveredState({ name:state.name, x:event.clientX, y:event.clientY })}
            onPointerMove={(event) => setHoveredState({ name:state.name, x:event.clientX, y:event.clientY })}
            onPointerLeave={() => setHoveredState(null)}><title>{state.name}</title></path>) }
          <path className="nationOutline" d={map.nation} aria-hidden="true"/><path className="route" d={routePath} aria-hidden="true"/>
        </g>
        {stops.map((stop,index) => {
          const [x,y] = map.positions[index];
          const selected = stop.id === active.id;
          return <g className={`stop ${selected ? "stopActive" : ""}`} key={stop.id} role="button" tabIndex={0}
            aria-label={`${stop.number}. ${stop.title}`} aria-pressed={selected} transform={`translate(${x} ${y})`}
            onClick={() => setActiveId(stop.id)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveId(stop.id); } }}>
            <circle r="17"/><text>{stop.number}</text>
          </g>;
        })}
      </svg>
      {hoveredState && <div className="stateTooltip" style={{ left:hoveredState.x + 14, top:hoveredState.y + 14 }}>{hoveredState.name}</div>}
      <aside className="storyCard" aria-live="polite"><div className="storyIndex">Остановка {active.number}</div><h2>{active.title}</h2><p>{active.note}</p></aside>
    </section>
    <footer className="footnote"><span>Нажмите на точку маршрута</span><span>Текст и места будут уточнены по архиву</span></footer>
  </main>;
}

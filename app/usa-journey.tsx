"use client";

import { useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import states from "us-atlas/states-10m.json";
import { routeCoordinates } from "./route-data";

type Stop = {
  id:string;
  number:string;
  title:string;
  note:string;
  coordinates:[number,number];
  role?:"start" | "finish";
  markerOffset?:[number,number];
};

const stops: Stop[] = [
  { id:"new-york-start", number:"01", title:"Старт · Нью-Йорк", note:"6 октября · Прилёт, получение машины и три часа на выезд из города.", coordinates:[-73.7797,40.6446], role:"start", markerOffset:[42,24] },
  { id:"delaware-gap", number:"02", title:"Делавэр-Уотер-Гэп", note:"7 октября · Первый американский трейл: скалы, облака и граница Нью-Джерси с Пенсильванией.", coordinates:[-75.1435,40.9888] },
  { id:"galion", number:"03", title:"Галион, Огайо", note:"8 октября · Марафонская тренировка в маленьком городе и дорога дальше на запад.", coordinates:[-82.8038,40.7352] },
  { id:"chicago", number:"04", title:"Чикаго", note:"9–13 октября · Озеро Мичиган, марафон и первые дни большого путешествия.", coordinates:[-87.6405,41.8831] },
  { id:"starved-rock", number:"05", title:"Starved Rock", note:"9 октября · Каньоны, водопады и лесные трейлы вдоль реки Иллинойс.", coordinates:[-89.0107,41.3641] },
  { id:"omaha", number:"06", title:"Омаха", note:"15 октября · Пробежка вдоль Миссури между Айовой и Небраской.", coordinates:[-95.9056,41.2529] },
  { id:"colorado", number:"07", title:"Колорадо", note:"16–17 октября · Скалистые горы и движение всё дальше на запад.", coordinates:[-104.8295,38.8297] },
  { id:"grand-canyon", number:"08", title:"Гранд-Каньон", note:"18 октября · Место, которое невозможно передать фотографиями, и тренировка над каньоном.", coordinates:[-111.8273,36.0409] },
  { id:"los-angeles", number:"09", title:"Лос-Анджелес", note:"19–20 октября · Тихий океан, двадцатикилометровый лонг и закат на западном берегу.", coordinates:[-118.3885,33.8097] },
  { id:"las-vegas", number:"10", title:"Лас-Вегас", note:"21 октября · После города ангелов — город грехов и разворот на восток.", coordinates:[-115.1602,36.1134] },
  { id:"houston", number:"11", title:"Хьюстон", note:"24 октября · Космический центр и крупнейший город Техаса.", coordinates:[-95.0981,29.5518] },
  { id:"new-orleans", number:"12", title:"Новый Орлеан", note:"25 октября · Миссисипи и Французский квартал — маленькая Европа внутри Америки.", coordinates:[-90.0629,29.9574] },
  { id:"gulf", number:"13", title:"Мексиканский залив", note:"25–26 октября · Белый песок и узкая полоса пляжа между заливом и бухтой.", coordinates:[-87.1066,30.3384] },
  { id:"naples", number:"14", title:"Нейплс", note:"26 октября · Двадцать километров вдоль западного берега Флориды навстречу закату.", coordinates:[-81.7905,26.1415] },
  { id:"miami", number:"15", title:"Майами", note:"27 октября · Через болота и аллигаторов к Атлантике и Майами-Бич.", coordinates:[-80.1321,25.7906] },
  { id:"daytona", number:"16", title:"Дейтона-Бич", note:"28 октября · NASCAR, знаменитый пляж и тренировка против атлантического ветра.", coordinates:[-81.0191,29.2099] },
  { id:"savannah", number:"17", title:"Сент-Огастин и Саванна", note:"28–29 октября · Старейший город США, колониальная архитектура и дорога на север.", coordinates:[-81.0999,32.0795] },
  { id:"washington", number:"18", title:"Вашингтон", note:"30 октября · Беговая экскурсия по столице и новый фаворит среди больших городов.", coordinates:[-77.0364,38.8875] },
  { id:"new-york-finish", number:"19", title:"Финиш · Нью-Йорк", note:"31 октября — 3 ноября · Парад наций, марафон через пять районов и завершение круга.", coordinates:[-74.0063,40.7595], role:"finish", markerOffset:[30,-24] },
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
    const projection = geoAlbersUsa().translate([600,350]).scale(1300);
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
      routePositions:routeCoordinates.flatMap((coordinates) => {
        const position = projection([coordinates[0], coordinates[1]]);
        return position ? [position] : [];
      }),
    };
  },[]);
  const routePath = `M ${map.routePositions.map(([x,y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")}`;

  return <main className="journey">
    <header className="masthead">
      <div><div className="eyebrow">Архив путешествия · 2025</div><h1 className="title">Америка</h1></div>
      <div className="counter">6 октября — 3 ноября · 6 047 GPS-точек</div>
    </header>
    <section className="mapStage" aria-label="Схема путешествия по США">
      <svg className="mapSvg" viewBox="80 55 1040 590" role="img" aria-labelledby="map-title map-description">
        <title id="map-title">Карта путешествия по США</title>
        <desc id="map-description">GPS-маршрут путешествия по континентальным США с девятнадцатью остановками.</desc>
        <g>
          {map.statePaths.map((state:StatePath) => <path className="state" d={state.path} key={state.id}
            onPointerEnter={(event) => setHoveredState({ name:state.name, x:event.clientX, y:event.clientY })}
            onPointerMove={(event) => setHoveredState({ name:state.name, x:event.clientX, y:event.clientY })}
            onPointerLeave={() => setHoveredState(null)}><title>{state.name}</title></path>) }
          <path className="nationOutline" d={map.nation} aria-hidden="true"/>
          <path className="routeHalo" d={routePath} aria-hidden="true"/>
          <path className="route" d={routePath} aria-hidden="true"/>
        </g>
        {stops.map((stop,index) => {
          const [anchorX,anchorY] = map.positions[index];
          const [offsetX,offsetY] = stop.markerOffset ?? [0,0];
          const x = anchorX + offsetX;
          const y = anchorY + offsetY;
          const selected = stop.id === active.id;
          return <g className={`stop ${stop.role ? `stop-${stop.role}` : ""} ${selected ? "stopActive" : ""}`} key={stop.id} role="button" tabIndex={0}
            aria-label={`${stop.number}. ${stop.title}`} aria-pressed={selected} transform={`translate(${x} ${y})`}
            onClick={() => setActiveId(stop.id)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveId(stop.id); } }}>
            {stop.markerOffset && <line className="stopLeader" x1={-offsetX} y1={-offsetY} x2="0" y2="0"/>}
            <circle r="17"/>
            {!stop.role && <text>{stop.number}</text>}
            {stop.role === "start" && <g className="raceIcon raceIconStart" aria-hidden="true">
              <path d="M-6 9V-9M-6-8H7L3-3 7 2H-6"/>
            </g>}
            {stop.role === "finish" && <g className="raceIcon raceIconFinish" aria-hidden="true">
              <path className="flagPole" d="M-7 9V-9"/>
              <path className="flagOutline" d="M-7-8H7V3H-7Z"/>
              <path className="flagChecks" d="M-7-8H0V-2.5H-7ZM0-2.5H7V3H0Z"/>
            </g>}
            {stop.role && <text className="stopRole" y="30">{stop.role === "start" ? "СТАРТ" : "ФИНИШ"}</text>}
          </g>;
        })}
      </svg>
      {hoveredState && <div className="stateTooltip" style={{ left:hoveredState.x + 14, top:hoveredState.y + 14 }}>{hoveredState.name}</div>}
      <aside className="storyCard" aria-live="polite"><div className="storyIndex">Остановка {active.number}</div><h2>{active.title}</h2><p>{active.note}</p></aside>
    </section>
    <footer className="footnote"><span>Нажмите на точку маршрута</span><span>Точный трек Google Timeline · только континентальные США</span></footer>
  </main>;
}

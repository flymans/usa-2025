import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
  type MouseEvent,
} from "react";
import type { MapTransform } from "../types/journey";

const MAP_CENTER = { x: 600, y: 350 };
const VIEWBOX_WIDTH = 1040;
const clampScale = (scale: number) => Math.min(4, Math.max(1, scale));

export function useMapNavigation() {
  const [transform, setTransform] = useState<MapTransform>({ scale: 1, x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ distance: number; scale: number; x: number; y: number } | null>(null);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (animationTimer.current) clearTimeout(animationTimer.current);
    },
    [],
  );

  const animate = () => {
    if (animationTimer.current) clearTimeout(animationTimer.current);
    setIsAnimating(true);
    animationTimer.current = setTimeout(() => setIsAnimating(false), 240);
  };

  const zoomAt = (factor: number, center: { x: number; y: number }) =>
    setTransform((current) => {
      const scale = clampScale(current.scale * factor);
      if (scale === 1) return { scale: 1, x: 0, y: 0 };
      const ratio = scale / current.scale;
      return {
        scale,
        x: center.x - (center.x - current.x) * ratio,
        y: center.y - (center.y - current.y) * ratio,
      };
    });

  const zoomBy = (factor: number) => {
    animate();
    zoomAt(factor, MAP_CENTER);
  };
  const reset = () => {
    animate();
    setTransform({ scale: 1, x: 0, y: 0 });
  };

  const onWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.2 : 1 / 1.2);
  };

  const onDoubleClick = (event: MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    animate();
    zoomAt(1.6, point);
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest(".stop")) return;
    if (animationTimer.current) clearTimeout(animationTimer.current);
    setIsAnimating(false);
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [first, second] = [...pointers.current.values()];
      gesture.current = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        ...transform,
      };
    }
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const previous = pointers.current.get(event.pointerId)!;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && gesture.current) {
      const [first, second] = [...pointers.current.values()];
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const scale = clampScale((gesture.current.scale * distance) / gesture.current.distance);
      const ratio = scale / gesture.current.scale;
      setTransform({
        scale,
        x: MAP_CENTER.x - (MAP_CENTER.x - gesture.current.x) * ratio,
        y: MAP_CENTER.y - (MAP_CENTER.y - gesture.current.y) * ratio,
      });
    } else if (transform.scale > 1) {
      const unitsPerPixel = VIEWBOX_WIDTH / event.currentTarget.getBoundingClientRect().width;
      setTransform((current) => ({
        ...current,
        x: current.x + (event.clientX - previous.x) * unitsPerPixel,
        y: current.y + (event.clientY - previous.y) * unitsPerPixel,
      }));
    }
  };

  const endPointer = (event: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    gesture.current = null;
  };

  return {
    transform,
    isAnimating,
    zoomBy,
    reset,
    svgHandlers: {
      onWheel,
      onDoubleClick,
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
    },
  };
}

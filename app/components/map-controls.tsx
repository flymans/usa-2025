type MapControlsProps = {
  scale: number;
  onZoom: (factor: number) => void;
  onReset: () => void;
};

export function MapControls({ scale, onZoom, onReset }: MapControlsProps) {
  return (
    <div className="mapControls" aria-label="Масштаб карты">
      <button
        type="button"
        onClick={() => onZoom(1.35)}
        disabled={scale >= 4}
        aria-label="Приблизить карту"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => onZoom(1 / 1.35)}
        disabled={scale <= 1}
        aria-label="Отдалить карту"
      >
        −
      </button>
      <button
        type="button"
        className="mapReset"
        onClick={onReset}
        disabled={scale === 1}
        aria-label="Сбросить масштаб"
      >
        1:1
      </button>
    </div>
  );
}

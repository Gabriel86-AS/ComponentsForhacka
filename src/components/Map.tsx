import { useMemo, useState } from "react";
import { Map as MapLibre } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import "maplibre-gl/dist/maplibre-gl.css";

import salesData from "../../Data/ventas_con_coordenadas.json";
import { cn } from "@/lib/utils";

interface VentaPorFecha {
  fecha: string;
  numeroVentas: number;
}

interface Store {
  tiendaId: number;
  nombre: string;
  lat: number;
  lng: number;
  totalVentas: number;
  ventasPorFecha: VentaPorFecha[];
}

interface SalesPoint {
  lat: number;
  lng: number;
  weight: number;
}

const STORES = salesData as Store[];

const ALL_DATES = Array.from(
  new Set(STORES.flatMap((s) => s.ventasPorFecha.map((v) => v.fecha)))
).sort();

const INITIAL_VIEW_STATE = {
  longitude: -74.2106,
  latitude: 11.2418,
  zoom: 16,
  pitch: 0,
  bearing: 0,
};

const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const HEATMAP_COLOR_RANGE: [number, number, number, number][] = [
  [0, 255, 178, 180],
  [254, 217, 118, 200],
  [254, 178, 76, 220],
  [253, 141, 60, 240],
  [240, 59, 32, 255],
  [189, 0, 38, 255],
];

type DateFilter = string | "all";

function pointsForDate(filter: DateFilter): SalesPoint[] {
  if (filter === "all") {
    return STORES.map((s) => ({ lat: s.lat, lng: s.lng, weight: s.totalVentas }));
  }
  return STORES.flatMap((s) => {
    const venta = s.ventasPorFecha.find((v) => v.fecha === filter);
    if (!venta || venta.numeroVentas === 0) return [];
    return [{ lat: s.lat, lng: s.lng, weight: venta.numeroVentas }];
  });
}

function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export interface MapProps {
  className?: string;
}

export function Map({ className }: MapProps) {
  const [selectedDate, setSelectedDate] = useState<DateFilter>("all");
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const layer = useMemo(
    () =>
      new HeatmapLayer<SalesPoint>({
        id: `sales-heatmap-${selectedDate}`,
        data: pointsForDate(selectedDate),
        getPosition: (d) => [d.lng, d.lat],
        getWeight: (d) => d.weight,
        radiusPixels: 60 * Math.pow(2, viewState.zoom - 16),
        intensity: 1,
        threshold: 0.05,
        aggregation: "SUM",
        colorRange: HEATMAP_COLOR_RANGE,
      }),
    [selectedDate, viewState.zoom]
  );

  return (
    <div
      className={cn(
        "relative w-full max-w-[640px] h-[640px] rounded-xl overflow-hidden shadow-xl border border-border/50",
        className
      )}
      id="sales-heatmap-container"
    >
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e) => setViewState(e.viewState)}
        controller={true}
        layers={[layer]}
      >
        <MapLibre mapStyle={BASEMAP_STYLE} reuseMaps />
      </DeckGL>

      {/* Date selector overlay */}
      <div
        className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 bg-background/80 backdrop-blur-sm rounded-lg p-1.5 shadow-md border border-border/50"
        id="heatmap-date-selector"
      >
        <button
          type="button"
          onClick={() => setSelectedDate("all")}
          className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
            selectedDate === "all"
              ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm"
              : "text-foreground/70 hover:bg-muted"
          )}
        >
          Todos
        </button>
        {ALL_DATES.map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => setSelectedDate(date)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
              selectedDate === date
                ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm"
                : "text-foreground/70 hover:bg-muted"
            )}
          >
            {formatDateLabel(date)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Map;

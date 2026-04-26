import { useMemo } from "react";
import { Map as MapLibre } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import "maplibre-gl/dist/maplibre-gl.css";

import salesData from "../../Data/ventas_con_coordenadas.json";
import { cn } from "@/lib/utils";

interface SalesPoint {
  tiendaId: number;
  nombre: string;
  lat: number;
  lng: number;
  totalVentas: number;
}

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

export interface MapProps {
  className?: string;
}

export function Map({ className }: MapProps) {
  const layer = useMemo(
    () =>
      new HeatmapLayer<SalesPoint>({
        id: "sales-heatmap",
        data: salesData as SalesPoint[],
        getPosition: (d) => [d.lng, d.lat],
        getWeight: (d) => d.totalVentas,
        radiusPixels: 60,
        intensity: 1,
        threshold: 0.05,
        aggregation: "SUM",
        colorRange: HEATMAP_COLOR_RANGE,
      }),
    []
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
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[layer]}
      >
        <MapLibre mapStyle={BASEMAP_STYLE} reuseMaps />
      </DeckGL>
    </div>
  );
}

export default Map;

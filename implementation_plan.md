# Implement Deck.gl Sales Heatmap Component

This plan details the steps to parse location data from the provided JSON file, install necessary geospatial visualization libraries, and create a React component that displays a heatmap of sales data using Deck.gl and MapLibre.

## User Review Required

> [!IMPORTANT]
> This plan proposes installing several new dependencies for geospatial visualization (`deck.gl`, `maplibre-gl`, `react-map-gl`). Please review these additions. Also, the data parsing step will create a new JSON file to avoid modifying the original data.

## Open Questions

> [!WARNING]
> Do you have a preferred MapLibre style URL (e.g., a dark mode base map) that you would like me to use? If not, I will use a default CartoDB Positron or similar open-source style.

## Proposed Changes

---

### Data Processing Scripts

#### [NEW] `scripts/extractCoordinates.js`
Create a Node.js script to process the existing JSON file.
- It will parse `Data/ventas_diarias_carrera5_santamarta.json`.
- Extract `lat` and `lng` from the Google Maps URL embedded in the `direccion` field using a regular expression.
- Save the enhanced dataset to `Data/ventas_diarias_con_coordenadas.json`.

---

### Dependencies

#### [MODIFY] `package.json`
Install the necessary dependencies to render the map and heatmap.
- Install `deck.gl`, `maplibre-gl`, and `react-map-gl`.

---

### React Components

#### [NEW] `src/components/SalesHeatmap.tsx`
Create a reusable React component for the heatmap.
- Use `DeckGL` with a `HeatmapLayer` from `@deck.gl/aggregation-layers`.
- Read data from `Data/ventas_diarias_con_coordenadas.json`.
- The heatmap will use `numeroVentas` as the weight for the data points, rendering areas with more sales as "hot/red" zones.
- Implement a `maplibre-gl` underlying basemap.

#### [MODIFY] `src/App.tsx`
Update the main application to render the `SalesHeatmap` component so you can preview the implementation.

## Verification Plan

### Automated Tests
- N/A for this visual component, but we will run `npm run dev` and ensure there are no console errors.

### Manual Verification
- Execute `node scripts/extractCoordinates.js` to ensure the new JSON file is created successfully with valid coordinates.
- Start the Vite development server.
- Verify visually that the map renders at the correct coordinates for Santa Marta.
- Verify visually that the heatmap layer correctly highlights the zones with the highest `numeroVentas` in red/hot colors.

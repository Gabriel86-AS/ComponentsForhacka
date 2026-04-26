import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const inputPath = resolve(projectRoot, "Data/ventas_diarias_carrera5_santamarta.json");
const outputPath = resolve(projectRoot, "Data/ventas_con_coordenadas.json");

const COORD_REGEX = /@(-?\d+\.\d+),(-?\d+\.\d+),\d+(?:\.\d+)?z/;

const raw = JSON.parse(readFileSync(inputPath, "utf8"));

const byStore = new Map();

for (const record of raw) {
  const match = record.direccion?.match(COORD_REGEX);
  if (!match) {
    console.warn(`Skipping record (no coords): tiendaId=${record.tiendaId} fecha=${record.fecha}`);
    continue;
  }
  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);

  const existing = byStore.get(record.tiendaId);
  if (existing) {
    existing.totalVentas += record.numeroVentas;
    existing.ventasPorFecha.push({ fecha: record.fecha, numeroVentas: record.numeroVentas });
  } else {
    byStore.set(record.tiendaId, {
      tiendaId: record.tiendaId,
      nombre: record.nombre,
      RUT: record.RUT,
      owner: record.owner,
      lat,
      lng,
      totalVentas: record.numeroVentas,
      ventasPorFecha: [{ fecha: record.fecha, numeroVentas: record.numeroVentas }],
    });
  }
}

const result = [...byStore.values()].sort((a, b) => a.tiendaId - b.tiendaId);

writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf8");

const totals = result.map((s) => s.totalVentas);
const lats = result.map((s) => s.lat);
const lngs = result.map((s) => s.lng);

console.log(`Wrote ${result.length} stores to ${outputPath}`);
console.log(`totalVentas: min=${Math.min(...totals)} max=${Math.max(...totals)}`);
console.log(`bbox: lat [${Math.min(...lats)}, ${Math.max(...lats)}] lng [${Math.min(...lngs)}, ${Math.max(...lngs)}]`);

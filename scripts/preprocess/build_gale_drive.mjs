#!/usr/bin/env node
// Base and drive line for the step 1 crater view.
//
// Base: Bradbury Landing, Curiosity's landing site (first waypoint, sol 3). Drive: Curiosity's real
// traverse from there to Murray Buttes (waypoints up to sol 1452), simplified to points about 150 m apart.
// Source: NASA/JPL-Caltech MSL_waypoints.json (MMGIS), cached in data/raw/msl/ (fetched if missing).
// Adds `base` and `drive` (grid col/row, same convention as the sites) to app/public/data/gale/gale_hrsc.json.
//
// Run from the repo root: node scripts/preprocess/build_gale_drive.mjs

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const URL = 'https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json';
const RAW = 'data/raw/msl/MSL_waypoints.json';
const META = 'app/public/data/gale/gale_hrsc.json';
const LAST_SOL = 1452;  // Murray Buttes (research/data-sites.md)
const STEP_KM = 0.15;

if (!existsSync(RAW)) {
  mkdirSync('data/raw/msl', { recursive: true });
  writeFileSync(RAW, Buffer.from(await (await fetch(URL)).arrayBuffer()));
}
const wp = JSON.parse(readFileSync(RAW, 'utf8')).features.map((f) => f.properties).filter((p) => p.sol <= LAST_SOL);
const meta = JSON.parse(readFileSync(META, 'utf8'));
const B = meta.bounds, kmpp = meta.km_per_pixel;
const toGrid = (lon, lat) => ({
  col: +(((lon - B.lon_west) / (B.lon_east - B.lon_west)) * meta.cols).toFixed(2),
  row: +(((B.lat_north - lat) / (B.lat_north - B.lat_south)) * meta.rows).toFixed(2),
});
const land = wp[0];
const drive = [];
for (const p of wp) {
  const g = toGrid(p.lon, p.lat), last = drive[drive.length - 1];
  if (!last || Math.hypot(g.col - last[0], g.row - last[1]) * kmpp >= STEP_KM) drive.push([g.col, g.row]);
}
const m = meta.sites.find((s) => s.id === 'murray');
drive.push([m.col, m.row]);
let km = 0;
for (let i = 1; i < drive.length; i++) km += Math.hypot(drive[i][0] - drive[i - 1][0], drive[i][1] - drive[i - 1][1]) * kmpp;

meta.base = {
  id: 'base', name: 'Bradbury Landing', lon: land.lon, lat: land.lat, ...toGrid(land.lon, land.lat), elev_m: Math.round(land.elev_geoid),
  src: `Curiosity's landing site, first waypoint (sol ${land.sol}) in MSL_waypoints.json; the base placed here is our assumption`,
};
meta.drive = {
  points: drive, km: +km.toFixed(1), sols: [land.sol, wp[wp.length - 1].sol],
  src: `Curiosity's traverse, waypoints sol ${land.sol} to ${wp[wp.length - 1].sol}, MSL_waypoints.json, simplified to ${STEP_KM * 1000} m steps`,
  url: URL,
};
writeFileSync(META, JSON.stringify(meta, null, 1) + '\n');
console.log(`base at col ${meta.base.col}, row ${meta.base.row}; drive ${drive.length} points, ${km.toFixed(1)} km`);

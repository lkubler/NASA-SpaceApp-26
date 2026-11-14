// Node loader for the walk grids (tests and scripts).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { terrainFromBuffers } from '../src/core/terrain.js';

const dir = fileURLToPath(new URL('../public/data/murray/', import.meta.url));
const buf = (f) => { const b = readFileSync(dir + f); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };

let _t = null;
export function nodeTerrain() {
  if (!_t) _t = terrainFromBuffers(JSON.parse(readFileSync(dir + 'murray.json', 'utf8')), buf('walk_height.i16.bin'), buf('walk_slope.u8.bin'));
  return _t;
}

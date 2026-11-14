// Regional DTM layer (task 022): 800 x 800 cells of 5.059 m = 4.05 km, the planning grid for NASA-scale walkback.
// Same {hm, slope} shape as terrain/dtm.js. No import.meta.env here, so node tests can use it.
// Frame: map code works in the regional local frame (x east of the west edge, y south of the north edge, metres).
// The 1 km DTM grid (Walk view, Access Mars transform) sits inside it at an exact integer offset:
//   col_1km = col_reg * 5 - 700, row_1km = row_reg * 5 - 1488   (regional.json relation_to_1km_grid)
// so 1 km-frame metres = regional metres - (700, 1488) * cell_1km. Points outside the 1 km grid get negative or
// too-large 1 km-frame coordinates, which the Walk view clips.

export function decodeRegional(meta, heightBuf, slopeBuf) {
  const h16 = new Uint16Array(heightBuf), s8 = new Uint8Array(slopeBuf), n = meta.width * meta.height;
  const data = new Float32Array(n), slope = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    data[i] = h16[i] === meta.height_nodata ? NaN : meta.hmin + h16[i] * meta.height_scale;
    slope[i] = s8[i] === meta.slope_nodata ? NaN : s8[i] * meta.slope_scale;
  }
  return { hm: { width: meta.width, height: meta.height, cellSize_m: meta.cell_m, data, noData: NaN }, slope, meta, name: 'HiRISE DTM 040770, 5 m regional' };
}

export async function loadRegional(base) {
  const meta = await (await fetch(base + 'regional.json')).json();
  const [hb, sb] = await Promise.all([fetch(base + meta.height_file).then((r) => r.arrayBuffer()), fetch(base + meta.slope_file).then((r) => r.arrayBuffer())]);
  return decodeRegional(meta, hb, sb);
}

/** Frame conversions between the regional local frame and the 1 km frame (cell1_m = 1 km grid cell size). */
export function makeFrames(regionalMeta, cell1_m) {
  const r = regionalMeta.relation_to_1km_grid, off = { x: -r.col_offset * cell1_m, y: -r.row_offset * cell1_m };
  return {
    off,
    /** 1 km-frame metres {x,y} -> regional frame */
    fromCrop: (p) => ({ x: p.x + off.x, y: p.y + off.y }),
    /** regional frame -> 1 km-frame metres (may be negative or beyond the 1 km grid) */
    toCrop: (p) => ({ x: p.x - off.x, y: p.y - off.y }),
    /** 1 km grid cell (col,row, fractional ok) -> regional frame metres */
    cropCell: (c, rw) => ({ x: c * cell1_m + off.x, y: rw * cell1_m + off.y }),
  };
}

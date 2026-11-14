// HiRISE DTM layer for the Map (task 002 output, app/public/data/murray/).
// Returns the same grid format as terrain/heightmap.js, so the planner, viewshed and
// reserve code do not care which source they run on. To swap the layer, change DTM_BASE
// or return another {hm, slope} from a loader with the same shape.
// Local frame: x = metres east of the west edge, y = metres south of the north edge.
export const DTM_BASE = import.meta.env.BASE_URL + 'data/murray/';

export async function loadDtm(base = DTM_BASE) {
  const meta = await (await fetch(base + 'murray.json')).json();
  const d = meta.dtm;
  const [hb, sb] = await Promise.all([
    fetch(base + d.height_file).then((r) => r.arrayBuffer()),
    fetch(base + d.slope_file).then((r) => r.arrayBuffer()),
  ]);
  const h16 = new Uint16Array(hb), s8 = new Uint8Array(sb);
  const n = d.width * d.height;
  const data = new Float32Array(n), slope = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    data[i] = h16[i] === d.height_nodata ? NaN : d.hmin + h16[i] * d.height_scale;
    slope[i] = s8[i] === 255 ? NaN : s8[i] * d.slope_scale;
  }
  const hm = { width: d.width, height: d.height, cellSize_m: d.cell_m, data, noData: NaN };
  return { hm, slope, meta, name: 'HiRISE DTM ' + meta.source_dtm.split('_')[1] };
}

// Access Mars scene frame (x east, z north, Y up) <-> DTM local metres, from murray.json.
export function makeTransform(meta) {
  const tf = meta.transform_walk_to_dtm;
  const t = (tf.theta_deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  const cs = meta.dtm.cell_m, ox = tf.origin_in_dtm_crop_px.col * cs, oy = tf.origin_in_dtm_crop_px.row * cs;
  return {
    sceneToLocal(x, z) { const e = c * x + s * z, n = -s * x + c * z; return { x: ox + e, y: oy - n }; },
    localToScene(px, py) { const e = px - ox, n = oy - py; return { x: c * e - s * n, z: s * e + c * n }; },
    // lon/lat (deg) -> local metres (sphere R, relative to the scene origin lon/lat)
    lonLatToLocal(lon, lat) {
      const k = (Math.PI / 180) * 3396190, [lon0, lat0] = tf.origin_lonlat;
      return { x: ox + (lon - lon0) * k, y: oy - (lat - lat0) * k };
    },
    walkHalf_m: meta.walk.extent_m / 2,
  };
}

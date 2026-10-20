// Generated models come in at any size and offset: fit one to a height, standing on the ground at the origin.

/**
 * box: { min: [x,y,z], max: [x,y,z] } in model units -> { scale, offset } to apply (offset in scaled units).
 * Centred on x and z, or with root: "minX" its left edge at the origin (a wing grows out from its root).
 */
export function fitToHeight(box, height, { root = "centre" } = {}) {
  const scale = height / (box.max[1] - box.min[1]);
  const cx = root === "minX" ? box.min[0] : (box.min[0] + box.max[0]) / 2;
  const cz = (box.min[2] + box.max[2]) / 2;
  return { scale, offset: [-cx * scale, -box.min[1] * scale, -cz * scale] };
}

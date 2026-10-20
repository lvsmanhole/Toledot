// Generated models come in at any size and offset: fit one to a height, standing on the ground at the origin.

/** box: { min: [x,y,z], max: [x,y,z] } in model units -> { scale, offset } to apply (offset in scaled units). */
export function fitToHeight(box, height) {
  const scale = height / (box.max[1] - box.min[1]);
  const cx = (box.min[0] + box.max[0]) / 2;
  const cz = (box.min[2] + box.max[2]) / 2;
  return { scale, offset: [-cx * scale, -box.min[1] * scale, -cz * scale] };
}

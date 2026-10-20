// John's eyes: the camera of the vision. A keyframed path at eye height (as cameraRig), with the body's
// moments laid on top: he falls at the feet of what he sees (1:17, 19:10, 22:8) and is lifted up (4:1–2).

import { cameraRig, lerp, sramp } from "../../kit/common.js";

/** Eye height of a standing man, in metres. */
export const EYE = 1.62;

/** The pose of the eyes k of the way through a fall: height above the ground and pitch (face toward it). */
export function fallPose(k) {
  const s = sramp(k, 0, 1);
  return { height: lerp(EYE, 0.3, s), pitch: lerp(0, -1.2, s) };
}

/**
 * keys: cameraRig keyframes [[unit, eye position, look-at, fov?], ...] with the eyes at standing height.
 * falls: [[start, end, recover], ...] falls over start..end, lies there, rises over recover..recover + 1.
 * lifts: [[start, end, dy], ...] carried up by dy over start..end (and stays up).
 */
export function johnEyes(keys, { falls = [], lifts = [] } = {}) {
  const rig = cameraRig(keys);
  return {
    apply(camera, rel, time = 0, reducedMotion = false) {
      rig.apply(camera, rel, time, 0);
      let down = 0;
      for (const [a, b, r] of falls) down = Math.max(down, sramp(rel, a, b) * (1 - sramp(rel, r, r + 1)));
      const pose = fallPose(down);
      camera.position.y -= EYE - pose.height;
      for (const [a, b, dy] of lifts) camera.position.y += dy * sramp(rel, a, b);
      if (!reducedMotion) camera.position.y += Math.sin(time * 1.6) * 0.006; // breath
      camera.rotateX(pose.pitch);
      return { down };
    },
  };
}

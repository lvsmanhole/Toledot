// A creature or figure of the vision, as a Group: the generated model once the user has approved it
// (src/revelation/creatures.js), and until then a stand-in built in code, so every scene is whole either way.

import * as THREE from "three";

import { model } from "../../kit/library.js";
import { CREATURES } from "../creatures.js";
import { fitToHeight } from "./fit.js";

/**
 * creature("lamb", { height: 0.9, standIn: () => group }) -> Group, standing on its origin, `height` tall.
 * The approved model fills in when it arrives (the director waits for it before showing the scene).
 */
export function creature(key, { height = 1.75, standIn = () => new THREE.Group() } = {}) {
  const spec = CREATURES[key];
  if (!spec) throw new Error(`no creature "${key}"`);
  const group = new THREE.Group();
  group.name = key;
  if (spec.status !== "approved") {
    group.add(fitted(standIn(), height));
    return group;
  }
  model(key).then((root) => {
    // a generated model can face any way: `yaw` turns it to face as its stand-in does
    const turned = new THREE.Group();
    turned.add(root.clone(true));
    turned.rotation.y = spec.yaw ?? 0;
    const inst = fitted(turned, height);
    inst.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    group.add(inst);
  }).catch(() => group.add(fitted(standIn(), height)));
  return group;
}

/** Scale and place an object so it stands on the origin, `height` tall (the same for models and stand-ins). */
function fitted(object, height) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return object;
  const { scale, offset } = fitToHeight({ min: box.min.toArray(), max: box.max.toArray() }, height);
  const holder = new THREE.Group();
  object.scale.multiplyScalar(scale);
  object.position.set(object.position.x * scale + offset[0], object.position.y * scale + offset[1], object.position.z * scale + offset[2]);
  holder.add(object);
  return holder;
}

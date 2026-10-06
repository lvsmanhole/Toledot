// Shared helpers for scenes: easing, keyframed cameras, label sprites, disposal.

import * as THREE from "three";

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (x) => x * x * (3 - 2 * x);
export const sramp = (t, a, b) => smooth(ramp(t, a, b));
export const lerp = THREE.MathUtils.lerp;
/** 0 → 1 over [a,b], hold, 1 → 0 over [c,d]. */
export const pulse = (t, a, b, c, d) => sramp(t, a, b) * (1 - sramp(t, c, d));

/**
 * Camera rig through keyframes on the scene's own unit axis.
 * keys: [[unit, [px,py,pz], [lx,ly,lz], fov?], ...] sorted by unit.
 */
export function cameraRig(keys) {
  const pos = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k[1])), false, "centripetal");
  const look = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k[2])), false, "centripetal");
  const p = new THREE.Vector3();
  const l = new THREE.Vector3();
  const n = keys.length - 1;
  function param(u) {
    if (u <= keys[0][0]) return 0;
    for (let i = 0; i < n; i++) {
      const a = keys[i][0];
      const b = keys[i + 1][0];
      if (u <= b) {
        const k = clamp((u - a) / (b - a));
        return (i + smooth(k) * 0.55 + k * 0.45) / n;
      }
    }
    return 1;
  }
  function fovAt(u) {
    let f = keys[0][3] ?? 50;
    for (let i = 0; i < n; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      if (u >= a[0] && u <= b[0]) return lerp(a[3] ?? 50, b[3] ?? 50, smooth(clamp((u - a[0]) / (b[0] - a[0]))));
      f = b[3] ?? 50;
    }
    return f;
  }
  return {
    apply(camera, u, time = 0, drift = 1) {
      const k = param(u);
      pos.getPoint(k, p);
      look.getPoint(k, l);
      if (drift) {
        p.x += Math.sin(time * 0.21) * 0.35 * drift;
        p.y += Math.sin(time * 0.17) * 0.25 * drift;
      }
      camera.position.copy(p);
      camera.lookAt(l);
      const fov = fovAt(u);
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      return { position: p, target: l };
    },
  };
}

/** A text label as a camera-facing sprite (uses the page's loaded web fonts). */
export function textSprite(text, { size = 64, color = "#efe6d2", font = "Cormorant Garamond", weight = 500, italic = false, letterSpacing = 0.12, scale = 1 } = {}) {
  const canvas = document.createElement("canvas");
  const g = canvas.getContext("2d");
  const fontSpec = `${italic ? "italic " : ""}${weight} ${size}px "${font}", Georgia, serif`;
  g.font = fontSpec;
  const spaced = text.toUpperCase().split("").join(" ".repeat(Math.round(letterSpacing * 10)));
  const w = Math.ceil(g.measureText(spaced).width) + size;
  canvas.width = w;
  canvas.height = Math.ceil(size * 1.6);
  g.font = fontSpec;
  g.fillStyle = color;
  g.textBaseline = "middle";
  g.shadowColor = "rgba(0,0,0,0.6)";
  g.shadowBlur = size * 0.25;
  g.fillText(spaced, size / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const h = 1 * scale;
  sprite.scale.set((h * canvas.width) / canvas.height, h, 1);
  return sprite;
}

/** Soft radial glow texture, cached. */
let glow = null;
export function glowTexture() {
  if (glow) return glow;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.12, "rgba(255,250,235,0.85)");
  grad.addColorStop(0.35, "rgba(255,230,190,0.25)");
  grad.addColorStop(1, "rgba(255,220,170,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  glow = new THREE.CanvasTexture(canvas);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}

export function glowSprite(color = 0xffffff, scale = 1, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  s.scale.setScalar(scale);
  return s;
}

/** Free GPU memory held by a scene graph. */
export function disposeScene(root) {
  root.traverse((o) => {
    o.geometry?.dispose?.();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
      if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u.value?.isTexture) u.value.dispose();
      m.dispose?.();
    }
  });
}

/** Sets uTime/uPixelRatio on every ShaderMaterial in a list that has them. */
export function tickMaterials(materials, time, pixelRatio) {
  for (const m of materials) {
    if (m.uniforms?.uTime) m.uniforms.uTime.value = time;
    if (m.uniforms?.uPixelRatio) m.uniforms.uPixelRatio.value = pixelRatio;
  }
}

export function collectShaderMaterials(root) {
  const out = new Set();
  root.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) if (m.uniforms) out.add(m);
  });
  return [...out];
}

// Effects: particle weather (rain, ash, dust, embers, swarms, manna, petals), fire (curtain, flame,
// bush), and light (pillars, shafts, rainbow, tongues of fire).

import * as THREE from "three";

import { NOISE, rng } from "../engine/noise.js";

// ---------------------------------------------------------------- camera-following particle box
const PARTICLE_KINDS = {
  rain: { color: [0.7, 0.75, 0.82], size: 1.0, fall: 38, drift: 2, streak: 1, blending: "normal", opacity: 0.55 },
  ash: { color: [0.55, 0.52, 0.5], size: 1.6, fall: 0.9, drift: 1.6, streak: 0, blending: "normal", opacity: 0.8 },
  dust: { color: [0.82, 0.7, 0.52], size: 1.4, fall: -0.1, drift: 6, streak: 0, blending: "normal", opacity: 0.5 },
  embers: { color: [1.0, 0.55, 0.18], size: 1.2, fall: -2.2, drift: 1.2, streak: 0, blending: "add", opacity: 1 },
  gnats: { color: [0.08, 0.07, 0.06], size: 0.7, fall: 0, drift: 3, streak: 0, blending: "normal", opacity: 0.9, swarm: 1 },
  locusts: { color: [0.06, 0.05, 0.03], size: 1.8, fall: 0, drift: 9, streak: 0, blending: "normal", opacity: 0.95, swarm: 1 },
  manna: { color: [0.95, 0.95, 0.9], size: 0.9, fall: 0.6, drift: 0.3, streak: 0, blending: "normal", opacity: 0.9 },
  motes: { color: [1.0, 0.86, 0.55], size: 1.0, fall: -0.15, drift: 0.6, streak: 0, blending: "add", opacity: 0.8 },
  hail: { color: [0.85, 0.9, 1.0], size: 1.3, fall: 30, drift: 1, streak: 0.4, blending: "normal", opacity: 0.85 },
  snowstars: { color: [1.0, 0.95, 0.85], size: 1.1, fall: 6, drift: 0.5, streak: 1, blending: "add", opacity: 1 },
};

export function weather(kind, { count = 6000, box = [80, 50, 80], seed = 3 } = {}) {
  const k = PARTICLE_KINDS[kind];
  const random = rng(seed);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions.set([(random() - 0.5) * box[0], random() * box[1], (random() - 0.5) * box[2]], i * 3);
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uPixelRatio: { value: 1 }, uAmount: { value: 0 }, uCenter: { value: new THREE.Vector3() },
      uBox: { value: new THREE.Vector3(...box) }, uWind: { value: new THREE.Vector2(1, 0.2) },
      uColor: { value: new THREE.Color(...k.color) }, uOpacity: { value: k.opacity }, uFall: { value: k.fall },
      uDrift: { value: k.drift }, uSize: { value: k.size }, uSwarm: { value: k.swarm ?? 0 },
    },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime, uPixelRatio, uAmount, uFall, uDrift, uSize, uSwarm;
      uniform vec3 uCenter, uBox;
      uniform vec2 uWind;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * uFall * (0.7 + seed * 0.6), uBox.y);
        p.xz += uWind * uTime * uDrift * (0.6 + seed);
        if (uSwarm > 0.5) {
          float a = uTime * (0.6 + seed) + seed * 40.0;
          p += vec3(sin(a) * 3.0, sin(a * 1.3) * 1.5, cos(a * 0.8) * 3.0);
        }
        vec3 rel = mod(p - uCenter + uBox * 0.5, uBox) - uBox * 0.5;
        vec3 world = uCenter + rel;
        world.y = uCenter.y - uBox.y * 0.35 + p.y;
        vAlpha = step(seed, uAmount);
        vec4 mv = viewMatrix * vec4(world, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * uSize * 40.0 / -mv.z * vAlpha;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        ${k.streak ? "c.x *= 6.0;" : ""}
        float d = length(c);
        float a = smoothstep(0.5, 0.1, d) * uOpacity * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor ${k.blending === "add" ? "* a" : ""}, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: k.blending === "add" ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return {
    points,
    material,
    update({ time, pixelRatio, amount, center, wind = null }) {
      const u = material.uniforms;
      u.uTime.value = time;
      u.uPixelRatio.value = pixelRatio;
      u.uAmount.value = amount;
      if (center) u.uCenter.value.copy(center);
      if (wind) u.uWind.value.set(...wind);
      points.visible = amount > 0.001;
    },
  };
}

// ---------------------------------------------------------------- fire
const FLAME_FRAG = /* glsl */ `
  uniform float uTime, uAmount, uSeed, uGain, uFreqX, uFreqY, uNarrow;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    float h = vUv.y;
    vec2 p = vec2(vUv.x * uFreqX, h * uFreqY);
    float n = fbm(vec3(p.x + uSeed, p.y - uTime * 1.7, uTime * 0.25));
    float n2 = fbm(vec3(p.x * 2.4 - uSeed, p.y * 2.2 - uTime * 2.6, 3.0));
    float shape = (1.0 - h) * 1.5 + n * 1.1 + n2 * 0.45 - 0.75 - h * h * 0.6 - (1.0 - uAmount) * 1.8 - uNarrow * pow(abs(vUv.x - 0.5) * 2.0, 1.5) * (1.6 - h);
    float sides = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    float f = smoothstep(0.0, 0.32, shape) * sides;
    vec3 col = mix(vec3(0.55, 0.07, 0.01), vec3(1.0, 0.5, 0.1), smoothstep(0.05, 0.55, f));
    col = mix(col, vec3(1.0, 0.86, 0.55), smoothstep(0.75, 1.0, f));
    if (f < 0.004) discard;
    gl_FragColor = vec4(col * f * uGain, f * 0.7);
  }
`;
const UV_VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BILLBOARD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec2 scale = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
    mv.xy += position.xy * scale;
    gl_Position = projectionMatrix * mv;
  }
`;

/** A camera-facing flame (altar fire, burning bush, pillar of fire). Origin at the base. */
export function flame({ width = 2, height = 4, gain = 0.6, seed = 0 } = {}) {
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 1 }, uSeed: { value: seed }, uGain: { value: gain }, uFreqX: { value: 3 }, uFreqY: { value: 1.6 }, uNarrow: { value: 1.6 } },
    vertexShader: BILLBOARD_VERT,
    fragmentShader: FLAME_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.scale.set(width, height, 1);
  mesh.frustumCulled = false;
  return mesh;
}

/** A wall of flame spanning `width` along local x. */
export function flameCurtain({ width = 60, height = 15, gain = 0.42, seed = 0 } = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uSeed: { value: seed }, uGain: { value: gain }, uFreqX: { value: width / 2.2 }, uFreqY: { value: 1.4 }, uNarrow: { value: 0 } },
    vertexShader: UV_VERT,
    fragmentShader: FLAME_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.y = height / 2;
  return mesh;
}

// ---------------------------------------------------------------- light
/** A vertical column of light (pillar of fire/cloud, the ladder, a shaft from heaven). */
export function pillar({ radius = 3, height = 120, color = [1, 0.85, 0.55], gain = 1.2, soft = 0.35 } = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 1 }, uColor: { value: new THREE.Color(...color) }, uGain: { value: gain } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uAmount, uGain;
      uniform vec3 uColor;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      ${NOISE}
      void main() {
        float edge = pow(abs(dot(vN, vV)), ${soft.toFixed(2)});
        float flow = 0.75 + 0.25 * snoise(vec3(vUv.x * 6.0, vUv.y * 4.0 - uTime * 0.6, uTime * 0.1));
        float ends = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
        float a = edge * flow * ends * uAmount;
        gl_FragColor = vec4(uColor * a * uGain, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const geo = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
  geo.translate(0, height / 2, 0);
  return new THREE.Mesh(geo, material);
}

/** A slanted shaft of light (god ray) from above. */
export function lightShaft({ length = 120, top = 6, bottom = 18, color = [1, 0.93, 0.78], gain = 0.5 } = {}) {
  const m = pillar({ radius: 1, height: length, color, gain, soft: 0.9 });
  m.geometry.dispose();
  const g = new THREE.CylinderGeometry(top, bottom, length, 32, 1, true);
  g.translate(0, length / 2, 0);
  m.geometry = g;
  return m;
}

/** The bow in the cloud (Genesis 9:13). */
export function rainbow({ radius = 160, width = 12 } = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uAmount: { value: 0 } },
    vertexShader: UV_VERT,
    fragmentShader: /* glsl */ `
      uniform float uAmount;
      varying vec2 vUv;
      vec3 spectrum(float x) {
        return clamp(vec3(abs(x * 6.0 - 3.0) - 1.0, 2.0 - abs(x * 6.0 - 2.0), 2.0 - abs(x * 6.0 - 4.0)), 0.0, 1.0);
      }
      void main() {
        float band = vUv.y;
        float a = smoothstep(0.0, 0.15, band) * smoothstep(1.0, 0.85, band) * smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * uAmount * 0.35;
        gl_FragColor = vec4(spectrum(1.0 - band) * a, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const geo = new THREE.RingGeometry(radius - width, radius, 128, 1, 0, Math.PI);
  // remap uv: x along the arc, y across the band
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uv.setXY(i, Math.atan2(y, x) / Math.PI, (Math.hypot(x, y) - (radius - width)) / width);
  }
  return new THREE.Mesh(geo, material);
}

/** Many small flames above a crowd (Pentecost, Acts 2:3). */
export function tongues({ positions, height = () => 0, lift = 2.3 }) {
  const group = new THREE.Group();
  const flames = [];
  positions.forEach(([x, z], i) => {
    const f = flame({ width: 0.35, height: 0.8, gain: 0.9, seed: i * 1.7 });
    f.position.set(x, height(x, z) + lift, z);
    group.add(f);
    flames.push(f);
  });
  return {
    group,
    set(amount, time) {
      for (const f of flames) {
        f.material.uniforms.uAmount.value = amount;
        f.material.uniforms.uTime.value = time;
      }
      group.visible = amount > 0.01;
    },
  };
}

/** Update helper for anything built here that has uTime/uAmount. */
export function setFx(mesh, { time, amount }) {
  const u = mesh.material.uniforms;
  if (time !== undefined && u.uTime) u.uTime.value = time;
  if (amount !== undefined && u.uAmount) u.uAmount.value = amount;
  mesh.visible = amount === undefined || amount > 0.003;
}

/** A column of smoke rising from the origin; `lean` bends it downwind, `rise` sets its height. */
export function smoke({ count = 900, rise = 30, spread = 3, lean = [0, 0], color = [0.55, 0.52, 0.5], opacity = 0.35, size = 9, seed = 4, lit = false } = {}) {
  const random = rng(seed);
  const seeds = new Float32Array(count * 2);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) seeds.set([random(), random()], i * 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 2));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uPixelRatio: { value: 1 }, uAmount: { value: 1 }, uRise: { value: rise }, uSpread: { value: spread },
      uLean: { value: new THREE.Vector2(...lean) }, uColor: { value: new THREE.Color(...color) }, uOpacity: { value: opacity }, uSize: { value: size },
    },
    vertexShader: /* glsl */ `
      attribute vec2 seed;
      uniform float uTime, uPixelRatio, uAmount, uRise, uSpread, uSize;
      uniform vec2 uLean;
      varying float vLife;
      void main() {
        float life = fract(uTime * (0.05 + seed.x * 0.04) + seed.y);
        vLife = life;
        float a = seed.y * 40.0 + uTime * 0.3;
        vec3 p = vec3(cos(a), 0.0, sin(a)) * uSpread * (0.3 + life * 1.4) * seed.x;
        p.y = life * uRise;
        p.xz += uLean * life * life * uRise;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * uSize * (0.4 + life * 1.6) * 30.0 / -mv.z * step(seed.x, uAmount);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vLife;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * uOpacity * smoothstep(0.0, 0.08, vLife) * (1.0 - vLife);
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor${lit ? " * (1.0 + (1.0 - vLife) * 1.5)" : ""}, a);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

/** A gold genealogical thread with name posts, drawn progressively by `uDraw`. */
export function lineageThread(points, { width = 0.12, color = [1, 0.66, 0.24], gain = 1.5 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const material = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(...color) }, uGain: { value: gain } },
    vertexShader: UV_VERT,
    fragmentShader: /* glsl */ `
      uniform float uDraw, uTime, uGain;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float on = 1.0 - smoothstep(uDraw - 0.03, uDraw, vUv.x);
        float pulse = 0.7 + 0.3 * sin(vUv.x * 60.0 - uTime * 3.0);
        float a = on * smoothstep(0.0, 0.03, vUv.x);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor * uGain * pulse * a, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(200, points.length * 60), width, 6, false), material);
  mesh.userData.curve = curve;
  return mesh;
}

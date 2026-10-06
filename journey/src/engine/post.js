// Post-processing: bloom, then a grade pass that owns saturation, temperature, vignette, film grain,
// fades through a colour, and the screen-space cloud layer used when descending through the sky.

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { NOISE } from "./noise.js";

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uSaturation: { value: 1 },
    uTint: { value: new THREE.Vector3(1, 1, 1) },
    uExposure: { value: 1 },
    uVignette: { value: 0.55 },
    uGrain: { value: 0.045 },
    uFade: { value: 0 },
    uFadeColor: { value: new THREE.Vector3(0, 0, 0) },
    uClouds: { value: 0 },
    uCloudTravel: { value: 0 },
    uAspect: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uSaturation, uExposure, uVignette, uGrain, uFade, uClouds, uCloudTravel, uAspect;
    uniform vec3 uTint, uFadeColor;
    varying vec2 vUv;
    ${NOISE}
    float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb * uExposure;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSaturation) * uTint;

      // clouds rushing past: layered noise that scales outward as we travel through them
      if (uClouds > 0.001) {
        vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
        float r = length(p);
        float acc = 0.0;
        for (int i = 0; i < 3; i++) {
          float layer = fract(uCloudTravel * 0.6 + float(i) / 3.0);
          float scale = mix(3.5, 0.4, layer);
          float n = fbm(vec3(p * scale, float(i) * 4.1 + uTime * 0.03));
          float a = smoothstep(-0.1, 0.55, n) * sin(layer * 3.14159);
          acc = max(acc, a);
        }
        vec3 cloud = mix(vec3(0.78, 0.82, 0.9), vec3(1.0, 0.98, 0.95), acc);
        c = mix(c, cloud, clamp(acc * uClouds * (0.6 + 0.6 * r) + uClouds * uClouds * 0.35, 0.0, 1.0));
      }

      vec2 q = vUv - 0.5;
      c *= 1.0 - uVignette * dot(q, q) * 1.6;
      c += (hash12(vUv * 1000.0 + fract(uTime) * 100.0) - 0.5) * uGrain;
      c = mix(c, uFadeColor, uFade);
      gl_FragColor = vec4(max(c, 0.0), 1.0);
    }
  `,
};

export function createPost(renderer, width, height) {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.9, 0.6, 0.82);
  const grade = new ShaderPass(GradeShader);
  composer.addPass(renderPass);
  composer.addPass(bloom);
  composer.addPass(grade);
  composer.addPass(new OutputPass());
  return {
    composer,
    bloom,
    grade: grade.uniforms,
    setView(scene, camera) {
      renderPass.scene = scene;
      renderPass.camera = camera;
    },
    setSize(w, h) {
      composer.setSize(w, h);
      grade.uniforms.uAspect.value = w / h;
    },
  };
}

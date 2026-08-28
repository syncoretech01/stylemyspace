/**
 * Hero displacement plane. This module IS the lazy three.js chunk — import it only via import().
 * The renderer is created once per page lifetime on the shared canvas (see webgl-probe.ts) and
 * reused across mounts; per-mount resources (geometry, material, texture) are disposed on cleanup.
 */
import {
  LinearFilter,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderer,
} from "three";
import { getSharedCanvas, getSharedContext } from "./webgl-probe";

export type HeroScene = {
  start(): void;
  stop(): void;
  dispose(): void;
  /** Normalised pointer position, −1…1 on both axes (0,0 = rest). */
  setPointer(x: number, y: number): void;
  resize(): void;
};

let renderer: WebGLRenderer | null = null;

function getRenderer(): WebGLRenderer | null {
  if (renderer) return renderer;
  const canvas = getSharedCanvas();
  const context = getSharedContext();
  if (!context) return null;
  renderer = new WebGLRenderer({ canvas, context, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x363b2b, 1);
  return renderer;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform vec2 uPlane;    // css px
  uniform vec2 uImage;    // texture px
  uniform vec2 uPointer;  // -1..1
  uniform vec2 uAmp;      // max offset in uv units
  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    float planeAspect = uPlane.x / uPlane.y;
    float imageAspect = uImage.x / uImage.y;
    vec2 s = vec2(1.0);
    if (planeAspect > imageAspect) { s.y = imageAspect / planeAspect; } else { s.x = planeAspect / imageAspect; }
    // 2% zoom hides the edge pull when the plane is displaced.
    return (uv - 0.5) * s * 0.98 + 0.5;
  }

  void main() {
    vec2 uv = coverUv(vUv);
    vec3 base = texture2D(uMap, uv).rgb;
    float luma = dot(base, vec3(0.299, 0.587, 0.114));
    float depth = (smoothstep(0.15, 0.85, luma) - 0.5) * 2.0;   // -1 (dark, far) … 1 (bright, near)
    vec2 offset = uPointer * uAmp * (0.4 + 0.6 * depth);         // |offset| <= uAmp
    gl_FragColor = vec4(texture2D(uMap, uv + offset).rgb, 1.0);
  }
`;

export function createHeroScene(
  host: HTMLElement,
  image: HTMLImageElement,
  opts: { maxOffsetPx?: number; onReady?: () => void } = {},
): HeroScene | null {
  const r = getRenderer();
  if (!r) return null;
  const maxOffsetPx = opts.maxOffsetPx ?? 12;
  const canvas = r.domElement;
  host.appendChild(canvas);

  const texture = new Texture(image);
  texture.colorSpace = NoColorSpace; // pass-through pixels: the canvas matches the <img> beneath it
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uMap: { value: texture },
      uPlane: { value: new Vector2(1, 1) },
      uImage: { value: new Vector2(image.naturalWidth || 1, image.naturalHeight || 1) },
      uPointer: { value: new Vector2(0, 0) },
      uAmp: { value: new Vector2(0, 0) },
    },
  });
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new Mesh(geometry, material));

  const target = new Vector2(0, 0);
  const pointer = material.uniforms.uPointer!.value as Vector2;
  let running = false;
  let visible = true;
  let raf = 0;
  let disposed = false;

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setSize(w, h, false);
    (material.uniforms.uPlane!.value as Vector2).set(w, h);
    (material.uniforms.uAmp!.value as Vector2).set(maxOffsetPx / w, maxOffsetPx / h);
    render();
  };

  const render = () => {
    if (disposed) return;
    r.render(scene, camera);
  };

  const tick = () => {
    raf = 0;
    if (disposed || !running || !visible) return;
    pointer.lerp(target, 0.06);
    render();
    if (pointer.distanceTo(target) > 0.0005) raf = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (!raf && running && visible) raf = requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) kick();
    },
    { threshold: 0.01 },
  );
  io.observe(host);
  const onVisibility = () => {
    if (document.visibilityState === "visible") kick();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const ro = new ResizeObserver(() => resize());
  ro.observe(host);

  resize();
  opts.onReady?.();

  return {
    start() {
      running = true;
      kick();
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    setPointer(x, y) {
      target.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, -y)));
      kick();
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      // Keep the renderer (and its single context) alive for the next mount; detach the canvas.
      r.clear();
      canvas.remove();
    },
  };
}

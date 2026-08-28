/**
 * The single WebGL context for the whole site lives on one shared canvas element created here.
 * No three.js import: this file is tiny and safe for the initial bundle.
 */
let canvas: HTMLCanvasElement | null = null;
let context: WebGL2RenderingContext | WebGLRenderingContext | null | undefined;

export function getSharedCanvas(): HTMLCanvasElement {
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "hero-canvas";
  }
  return canvas;
}

/**
 * Try to obtain a hardware-accelerated context. Returns null on software GL (e.g. headless
 * Lighthouse/SwiftShader) or when WebGL is unavailable — callers keep the static image.
 */
export function getSharedContext() {
  if (context !== undefined) return context;
  const attrs: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: true,
  };
  const el = getSharedCanvas();
  try {
    context =
      (el.getContext("webgl2", attrs) as WebGL2RenderingContext | null) ??
      (el.getContext("webgl", attrs) as WebGLRenderingContext | null);
  } catch {
    context = null;
  }
  return context;
}

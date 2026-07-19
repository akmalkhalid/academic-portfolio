// Shared contract for the pillar-demo engines. Each engine is framework-agnostic
// (no React/DOM beyond a passed-in 2D canvas context) and is driven by the generic
// DemoCanvas runtime, which owns fit/resize, the rAF loop, off-screen pausing,
// reduced-motion handling, and (in interactive mode) pointer + controls.

export type DemoStat = { label: string; value: string }

export interface DemoEngine {
  /** (Re)build internal state for a new pixel size. Called on mount and resize. */
  resize(w: number, h: number): void
  /** Advance the simulation by one frame. */
  step(): void
  /** Render the current state. */
  draw(ctx: CanvasRenderingContext2D): void
  /** Interactive pointer input (only wired when the runtime is interactive). */
  pointer?(x: number, y: number, type: 'move' | 'down' | 'leave'): void
  /** Reset / regenerate (exposed as a control button in interactive mode). */
  reset?(): void
  /** Label for the reset control (default "Reset"). */
  resetLabel?: string
  /** Live readouts for interactive mode. */
  stats?(): DemoStat[]
  /** Produce a single representative frame for reduced-motion users. */
  settle?(): void
}

export type DemoFactory = (accent: string) => DemoEngine

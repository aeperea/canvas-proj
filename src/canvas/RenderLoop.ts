/**
 * Render Loop - Throttled rendering for performance
 *
 * Instead of rendering on every state change,
 * we batch updates and render at ~60fps
 */

type RenderCallback = () => void;

/**
 * Manages throttled rendering
 */
export class RenderLoop {
  private animationFrameId: number | null = null;
  private isDirty = false;
  private callback: RenderCallback;

  constructor(callback: RenderCallback) {
    this.callback = callback;
  }

  /**
   * Mark that something changed and needs rendering
   */
  markDirty(): void {
    this.isDirty = true;
    this.scheduleRender();
  }

  /**
   * Schedule the next render frame
   */
  private scheduleRender(): void {
    if (this.animationFrameId !== null) {
      // Already scheduled
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;

      if (this.isDirty) {
        this.isDirty = false;
        this.callback();
      }
    });
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

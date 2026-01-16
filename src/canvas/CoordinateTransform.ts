import {Point, Transform} from '../types';

/**
 * Coordinate Transform System
 *
 * Two coordinate spaces:
 * - World Space: The logical canvas where shapes live (pan/zoom independent)
 * - Screen Space: Pixels on the actual canvas (what user sees)
 *
 * Transformation formula:
 * screenPos = worldPos * zoom + pan
 */

/**
 * Convert from world space to screen space
 * screenX = worldX * zoom + panX
 * screenY = worldY * zoom + panY
 */
export function worldToScreen(worldPos: Point, transform: Transform): Point {
  return {
    x: worldPos.x * transform.zoom + transform.panX,
    y: worldPos.y * transform.zoom + transform.panY,
  };
}

/**
 * Convert from screen space to world space
 * worldX = (screenX - panX) / zoom
 * worldY = (screenY - panY) / zoom
 */
export function screenToWorld(screenPos: Point, transform: Transform): Point {
  return {
    x: (screenPos.x - transform.panX) / transform.zoom,
    y: (screenPos.y - transform.panY) / transform.zoom,
  };
}

/**
 * Apply pan and zoom
 * Useful for mouse wheel zoom centered on a point
 */
export function applyPan(transform: Transform, panDelta: Point): Transform {
  return {
    ...transform,
    panX: transform.panX + panDelta.x,
    panY: transform.panY + panDelta.y,
  };
}

/**
 * Apply zoom centered on a world point
 * To zoom in at cursor position, we need to:
 * 1. Convert cursor to world space
 * 2. Apply zoom
 * 3. Adjust pan so the world point stays under cursor
 */
export function applyZoom(
  transform: Transform,
  zoomDelta: number,
  cursorScreenPos: Point
): Transform {
  // Convert cursor to world space before zoom
  const cursorWorldBefore = screenToWorld(cursorScreenPos, transform);

  // Apply zoom
  const newZoom = Math.max(0.1, Math.min(5, transform.zoom * (1 + zoomDelta)));

  // Convert cursor to world space after zoom
  const cursorWorldAfter = screenToWorld(cursorScreenPos, {
    ...transform,
    zoom: newZoom,
  });

  // Calculate pan adjustment to keep world point under cursor
  const worldDelta = {
    x: cursorWorldBefore.x - cursorWorldAfter.x,
    y: cursorWorldBefore.y - cursorWorldAfter.y,
  };

  return {
    panX: transform.panX + worldDelta.x * newZoom,
    panY: transform.panY + worldDelta.y * newZoom,
    zoom: newZoom,
  };
}

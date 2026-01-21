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
 * 1. Convert cursor to world space before zoom
 * 2. Apply new zoom
 * 3. Adjust pan so the same world point stays under cursor
 */
export function applyZoom(
  transform: Transform,
  zoomDelta: number,
  cursorScreenPos: Point
): Transform {
  // Convert cursor to world space before zoom
  const worldPoint = screenToWorld(cursorScreenPos, transform);

  // Apply zoom
  const newZoom = Math.max(0.1, Math.min(5, transform.zoom * (1 + zoomDelta)));

  // Calculate new pan to keep the world point under the cursor
  // screenPos = worldPos * zoom + pan
  // pan = screenPos - worldPos * zoom
  const newPanX = cursorScreenPos.x - worldPoint.x * newZoom;
  const newPanY = cursorScreenPos.y - worldPoint.y * newZoom;

  return {
    panX: newPanX,
    panY: newPanY,
    zoom: newZoom,
  };
}

import {Point, Rectangle, ResizeHandle, Transform} from '../types';
import {worldToScreen, screenToWorld} from './CoordinateTransform';

/**
 * Resize Handles - Manage resize handles for selected shapes
 */

const HANDLE_SIZE = 8; // Handle size in screen pixels
const HANDLE_HIT_MARGIN = 4; // Extra pixels for easier clicking

/**
 * Get all handle positions for a rectangle in world space
 */
export function getHandlePositions(
  rect: Rectangle
): Record<ResizeHandle, Point> {
  return {
    'top-left': {x: rect.x, y: rect.y},
    'top-right': {x: rect.x + rect.width, y: rect.y},
    'bottom-left': {x: rect.x, y: rect.y + rect.height},
    'bottom-right': {x: rect.x + rect.width, y: rect.y + rect.height},
    top: {x: rect.x + rect.width / 2, y: rect.y},
    right: {x: rect.x + rect.width, y: rect.y + rect.height / 2},
    bottom: {x: rect.x + rect.width / 2, y: rect.y + rect.height},
    left: {x: rect.x, y: rect.y + rect.height / 2},
  };
}

/**
 * Test if a point hits a resize handle
 * Returns the handle type if hit, null otherwise
 */
export function hitTestHandle(
  worldPos: Point,
  rect: Rectangle,
  transform: Transform
): ResizeHandle | null {
  const handles = getHandlePositions(rect);

  // Check each handle in priority order (corners first)
  const handleOrder: ResizeHandle[] = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'top',
    'right',
    'bottom',
    'left',
  ];

  for (const handle of handleOrder) {
    const handleWorldPos = handles[handle];
    const handleScreenPos = worldToScreen(handleWorldPos, transform);
    const clickScreenPos = worldToScreen(worldPos, transform);

    const distance = Math.sqrt(
      Math.pow(handleScreenPos.x - clickScreenPos.x, 2) +
        Math.pow(handleScreenPos.y - clickScreenPos.y, 2)
    );

    if (distance <= HANDLE_SIZE / 2 + HANDLE_HIT_MARGIN) {
      return handle;
    }
  }

  return null;
}

/**
 * Apply resize based on handle and delta movement
 */
export function applyResize(
  originalRect: Rectangle,
  handle: ResizeHandle,
  currentWorldPos: Point,
  startWorldPos: Point
): Rectangle {
  const dx = currentWorldPos.x - startWorldPos.x;
  const dy = currentWorldPos.y - startWorldPos.y;

  const newRect = {...originalRect};

  const MIN_SIZE = 10;

  // Corner handles - resize both dimensions freely based on cursor position
  if (handle === 'top-left') {
    const newWidth = originalRect.width - dx;
    const newHeight = originalRect.height - dy;

    if (newWidth >= MIN_SIZE) {
      newRect.x = originalRect.x + dx;
      newRect.width = newWidth;
    } else {
      newRect.x = originalRect.x + originalRect.width - MIN_SIZE;
      newRect.width = MIN_SIZE;
    }

    if (newHeight >= MIN_SIZE) {
      newRect.y = originalRect.y + dy;
      newRect.height = newHeight;
    } else {
      newRect.y = originalRect.y + originalRect.height - MIN_SIZE;
      newRect.height = MIN_SIZE;
    }
  } else if (handle === 'top-right') {
    const newWidth = originalRect.width + dx;
    const newHeight = originalRect.height - dy;

    newRect.width = Math.max(MIN_SIZE, newWidth);

    if (newHeight >= MIN_SIZE) {
      newRect.y = originalRect.y + dy;
      newRect.height = newHeight;
    } else {
      newRect.y = originalRect.y + originalRect.height - MIN_SIZE;
      newRect.height = MIN_SIZE;
    }
  } else if (handle === 'bottom-left') {
    const newWidth = originalRect.width - dx;
    const newHeight = originalRect.height + dy;

    if (newWidth >= MIN_SIZE) {
      newRect.x = originalRect.x + dx;
      newRect.width = newWidth;
    } else {
      newRect.x = originalRect.x + originalRect.width - MIN_SIZE;
      newRect.width = MIN_SIZE;
    }

    newRect.height = Math.max(MIN_SIZE, newHeight);
  } else if (handle === 'bottom-right') {
    newRect.width = Math.max(MIN_SIZE, originalRect.width + dx);
    newRect.height = Math.max(MIN_SIZE, originalRect.height + dy);
  }
  // Edge handles - resize one dimension only
  else if (handle === 'top') {
    const newHeight = originalRect.height - dy;

    if (newHeight >= MIN_SIZE) {
      newRect.y = originalRect.y + dy;
      newRect.height = newHeight;
    } else {
      newRect.y = originalRect.y + originalRect.height - MIN_SIZE;
      newRect.height = MIN_SIZE;
    }
  } else if (handle === 'right') {
    newRect.width = Math.max(MIN_SIZE, originalRect.width + dx);
  } else if (handle === 'bottom') {
    newRect.height = Math.max(MIN_SIZE, originalRect.height + dy);
  } else if (handle === 'left') {
    const newWidth = originalRect.width - dx;

    if (newWidth >= MIN_SIZE) {
      newRect.x = originalRect.x + dx;
      newRect.width = newWidth;
    } else {
      newRect.x = originalRect.x + originalRect.width - MIN_SIZE;
      newRect.width = MIN_SIZE;
    }
  }

  return newRect;
}

/**
 * Get cursor style for a resize handle
 */
export function getCursorForHandle(handle: ResizeHandle): string {
  const cursors: Record<ResizeHandle, string> = {
    'top-left': 'nwse-resize',
    'top-right': 'nesw-resize',
    'bottom-left': 'nesw-resize',
    'bottom-right': 'nwse-resize',
    top: 'ns-resize',
    right: 'ew-resize',
    bottom: 'ns-resize',
    left: 'ew-resize',
  };
  return cursors[handle];
}

/**
 * Get handle size in world coordinates (for consistent screen size)
 */
export function getHandleSizeInWorld(transform: Transform): number {
  return HANDLE_SIZE / transform.zoom;
}

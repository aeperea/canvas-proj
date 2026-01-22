import React, {useRef, useEffect, useState} from 'react';
import './App.css';
import {EditorState, Rectangle} from './types';
import {
  createInitialState,
  addShape,
  createRectangle,
  selectShape,
  setTransform,
  updateShape,
  getShapeById,
} from './canvas/SceneGraph';
import {applyPan, applyZoom, screenToWorld} from './canvas/CoordinateTransform';
import {RenderLoop} from './canvas/RenderLoop';
import {render} from './canvas/Renderer';
import {loadState, saveState} from './utils/persistence';
import {
  hitTestHandle,
  applyResize,
  getCursorForHandle,
} from './canvas/ResizeHandles';
import {
  createHistoryState,
  pushHistory,
  undo,
  redo,
  getCurrentState,
  canUndo,
  canRedo,
  type HistoryState,
} from './utils/history';
import {
  isUndoShortcut,
  isRedoShortcut,
  getUndoShortcut,
  getRedoShortcut,
} from './utils/os';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialState = createInitialState();
  const [history, setHistory] = useState<HistoryState>(() => {
    const savedState = loadState();
    return createHistoryState(savedState || initialState);
  });
  const state = history.present;
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('grab');
  const [showHistoryStats, setShowHistoryStats] = useState(false);
  const renderLoopRef = useRef<RenderLoop | null>(null);
  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef({x: 0, y: 0});

  // Helper to update state through history
  const updateStateWithHistory = (
    updater: (state: EditorState) => EditorState
  ) => {
    setHistory((prevHistory) => {
      const newState = updater(prevHistory.present);
      return pushHistory(prevHistory, newState);
    });
  };

  // Direct state update (for transient state like resizing, dragging, panning)
  const setState = (updater: (state: EditorState) => EditorState) => {
    setHistory((prevHistory) => ({
      ...prevHistory,
      present: updater(prevHistory.present),
    }));
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Initialize render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderLoopRef.current?.markDirty();
    };

    // Create render loop
    const renderLoop = new RenderLoop(() => {
      render(ctx, canvas, state);
    });
    renderLoopRef.current = renderLoop;
    renderLoop.markDirty();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      renderLoop.stop();
    };
  }, [state]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only react to our storage key changes
      if (e.key !== 'canvas-proj-state') return;

      // Load the new state from storage
      const newState = loadState();
      if (newState) {
        setHistory(createHistoryState(newState));
        setLastSyncTime(Date.now());
        renderLoopRef.current?.markDirty();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for undo/redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUndoShortcut(e)) {
        e.preventDefault();
        setHistory((prevHistory) => {
          const newHistory = undo(prevHistory);
          if (newHistory) {
            renderLoopRef.current?.markDirty();
            return newHistory;
          }
          return prevHistory;
        });
      } else if (isRedoShortcut(e)) {
        e.preventDefault();
        setHistory((prevHistory) => {
          const newHistory = redo(prevHistory);
          if (newHistory) {
            renderLoopRef.current?.markDirty();
            return newHistory;
          }
          return prevHistory;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const zoomDelta = -e.deltaY * 0.001; // Negative: scroll up = zoom in
    const cursorScreenPos = {x: e.clientX, y: e.clientY};

    setState((prevState) => {
      const newTransform = applyZoom(
        prevState.transform,
        zoomDelta,
        cursorScreenPos
      );
      return setTransform(prevState, newTransform);
    });
  };

  // Pan with mouse drag and resize handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+Left click = pan
      isPanningRef.current = true;
      lastMousePosRef.current = {x: e.clientX, y: e.clientY};
    } else if (e.button === 0) {
      // Left click = select or start resize
      const worldPos = screenToWorld(
        {x: e.clientX, y: e.clientY},
        state.transform
      );

      // First check if clicking on a resize handle of selected shape
      if (state.selectedShapeId) {
        const selectedShape = getShapeById(state, state.selectedShapeId);
        if (selectedShape && selectedShape.type === 'rectangle') {
          const handle = hitTestHandle(
            worldPos,
            selectedShape,
            state.transform
          );
          if (handle) {
            // Start resizing
            setState((prevState) => ({
              ...prevState,
              resizing: {
                shapeId: selectedShape.id,
                handle,
                startWorldPos: worldPos,
                startShape: {...selectedShape},
              },
            }));
            return;
          }
        }
      }

      // Check if clicked on a shape (simple hit test)
      let hitShapeId: string | null = null;
      let hitShape: Rectangle | null = null;
      for (const shape of state.shapes) {
        if (
          shape.type === 'rectangle' &&
          worldPos.x >= shape.x &&
          worldPos.x <= shape.x + shape.width &&
          worldPos.y >= shape.y &&
          worldPos.y <= shape.y + shape.height
        ) {
          hitShapeId = shape.id;
          hitShape = shape;
          break;
        }
      }

      if (hitShapeId && hitShape) {
        // Start dragging the shape
        setState((prevState) => ({
          ...selectShape(prevState, hitShapeId),
          dragging: {
            shapeId: hitShapeId,
            startWorldPos: worldPos,
            startShapePos: {x: hitShape.x, y: hitShape.y},
          },
        }));
      } else {
        setState((prevState) => selectShape(prevState, null));
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(
      {x: e.clientX, y: e.clientY},
      state.transform
    );

    // Handle active resize
    if (state.resizing) {
      setState((prevState) => {
        if (!prevState.resizing) return prevState;

        const newRect = applyResize(
          prevState.resizing.startShape,
          prevState.resizing.handle,
          worldPos,
          prevState.resizing.startWorldPos
        );

        return updateShape(prevState, prevState.resizing.shapeId, newRect);
      });
      return;
    }

    // Handle active drag
    if (state.dragging) {
      setState((prevState) => {
        if (!prevState.dragging) return prevState;

        const dx = worldPos.x - prevState.dragging.startWorldPos.x;
        const dy = worldPos.y - prevState.dragging.startWorldPos.y;

        const newX = prevState.dragging.startShapePos.x + dx;
        const newY = prevState.dragging.startShapePos.y + dy;

        return updateShape(prevState, prevState.dragging.shapeId, {
          x: newX,
          y: newY,
        });
      });
      return;
    }

    // Handle panning
    if (isPanningRef.current) {
      const delta = {
        x: e.clientX - lastMousePosRef.current.x,
        y: e.clientY - lastMousePosRef.current.y,
      };

      setState((prevState) => {
        const newTransform = applyPan(prevState.transform, delta);
        return setTransform(prevState, newTransform);
      });

      lastMousePosRef.current = {x: e.clientX, y: e.clientY};
      return;
    }

    // Update cursor based on hover
    if (state.selectedShapeId) {
      const selectedShape = getShapeById(state, state.selectedShapeId);
      if (selectedShape && selectedShape.type === 'rectangle') {
        const handle = hitTestHandle(worldPos, selectedShape, state.transform);
        if (handle) {
          setCursorStyle(getCursorForHandle(handle));
          return;
        }
        // Check if hovering over the shape itself
        if (
          worldPos.x >= selectedShape.x &&
          worldPos.x <= selectedShape.x + selectedShape.width &&
          worldPos.y >= selectedShape.y &&
          worldPos.y <= selectedShape.y + selectedShape.height
        ) {
          setCursorStyle('move');
          return;
        }
      }
    }
    setCursorStyle('grab');
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
    if (state.resizing || state.dragging) {
      // Finalize resize/drag by removing those states and pushing to history
      updateStateWithHistory((prevState) => ({
        ...prevState,
        resizing: null,
        dragging: null,
      }));
    }
  };

  // Double click to create a rectangle
  const handleDoubleClick = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(
      {x: e.clientX, y: e.clientY},
      state.transform
    );

    // Create shapes are undo-able
    updateStateWithHistory((prevState) => {
      const newRect = createRectangle(worldPos.x, worldPos.y);
      return addShape(prevState, newRect);
    });
  };

  return (
    <div className="app">
      <canvas
        ref={canvasRef}
        className="canvas"
        style={{cursor: cursorStyle}}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      <div className="status">
        Shapes: {state.shapes.length} | Zoom: {state.transform.zoom.toFixed(2)}x
        | Pan: ({state.transform.panX.toFixed(0)},{' '}
        {state.transform.panY.toFixed(0)}) | 💾 Saving...
        {lastSyncTime && (
          <span style={{marginLeft: '8px', color: '#4ade80'}}>
            ↔️ Synced across tabs
          </span>
        )}
        {showHistoryStats && (
          <span style={{marginLeft: '8px', color: '#fbbf24'}}>
            | Undo: {history.past.length} | Redo: {history.future.length}
          </span>
        )}
      </div>
      <div className="help">
        <div>🖱️ Scroll to zoom | Middle-click/Ctrl+drag to pan</div>
        <div>🖱️ Click to select | Double-click to create rectangle</div>
        <div>
          🔲 Drag corners to resize freely | Drag edges to resize one dimension
        </div>
        <div>✋ Drag shape to move</div>
        <div>
          ⟲ {getUndoShortcut()} to undo | {getRedoShortcut()} to redo
        </div>
      </div>
    </div>
  );
};

export default App;

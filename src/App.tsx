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

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<EditorState>(() => {
    const savedState = loadState();
    return savedState || createInitialState();
  });
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('grab');
  const renderLoopRef = useRef<RenderLoop | null>(null);
  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef({x: 0, y: 0});

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
        setState(newState);
        setLastSyncTime(Date.now());
        renderLoopRef.current?.markDirty();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
      for (const shape of state.shapes) {
        if (
          shape.type === 'rectangle' &&
          worldPos.x >= shape.x &&
          worldPos.x <= shape.x + shape.width &&
          worldPos.y >= shape.y &&
          worldPos.y <= shape.y + shape.height
        ) {
          hitShapeId = shape.id;
          break;
        }
      }

      setState((prevState) => selectShape(prevState, hitShapeId));
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
      }
    }
    setCursorStyle('grab');
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
    if (state.resizing) {
      setState((prevState) => ({...prevState, resizing: null}));
    }
  };

  // Double click to create a rectangle
  const handleDoubleClick = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(
      {x: e.clientX, y: e.clientY},
      state.transform
    );

    setState((prevState) => {
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
      </div>
      <div className="help">
        <div>🖱️ Scroll to zoom | Middle-click/Ctrl+drag to pan</div>
        <div>🖱️ Click to select | Double-click to create rectangle</div>
        <div>
          🔲 Drag corners to resize freely | Drag edges to resize one dimension
        </div>
      </div>
    </div>
  );
};

export default App;

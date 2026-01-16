import React, {useRef, useEffect, useState} from 'react';
import './App.css';
import {EditorState} from './types';
import {
  createInitialState,
  addShape,
  createRectangle,
  selectShape,
  setTransform,
} from './canvas/SceneGraph';
import {applyPan, applyZoom, screenToWorld} from './canvas/CoordinateTransform';
import {RenderLoop} from './canvas/RenderLoop';
import {render} from './canvas/Renderer';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<EditorState>(createInitialState());
  const renderLoopRef = useRef<RenderLoop | null>(null);
  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef({x: 0, y: 0});

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

  // Pan with mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+Left click = pan
      isPanningRef.current = true;
      lastMousePosRef.current = {x: e.clientX, y: e.clientY};
    } else if (e.button === 0) {
      // Left click = select
      const worldPos = screenToWorld(
        {x: e.clientX, y: e.clientY},
        state.transform
      );

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
    }
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
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
        {state.transform.panY.toFixed(0)})
      </div>
      <div className="help">
        <div>🖱️ Scroll to zoom | Middle-click/Ctrl+drag to pan</div>
        <div>🖱️ Click to select | Double-click to create rectangle</div>
      </div>
    </div>
  );
};

export default App;

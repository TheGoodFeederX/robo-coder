# Design Spec: Canvas Performance Optimization

**Date:** 2026-06-08
**Topic:** Rendering Performance & CPU Optimization
**Status:** Approved

## 1. Overview
The current `RobotCanvas` renders the entire scene (grid, axes, markers, trail, and robot) at 60fps regardless of whether the robot is moving. This leads to unnecessary CPU/GPU usage. This design introduces background caching and idle-aware animation to optimize performance.

## 2. Goals
- Reduce idle CPU usage to near zero.
- Improve rendering efficiency during movement by caching static elements.
- Maintain smooth 60fps animations for the robot and trail.

## 3. Architecture

### 3.1. Background Caching (Layering)
We will implement a "Static Layer" cache.
- **Offscreen Canvas:** A non-DOM `HTMLCanvasElement` will be created in memory.
- **One-Time Render:** The grid lines, X/Y axes, and coordinate labels will be drawn once to this offscreen canvas.
- **Redraw Trigger:** The background only redraws if the canvas dimensions change (though they are currently fixed at 500x500).

### 3.2. Idle-Aware Animation Loop
The `requestAnimationFrame` (rAF) loop will be modified to be conditional.
- **Motion Check:** The loop calculates the distance between `robotState` (current visual position) and `targetState` (logical position from context).
- **Auto-Stop:** If the robot has arrived at the target (distance < threshold), the loop will render one final frame and then terminate (i.e., not call `requestAnimationFrame` again).
- **Auto-Start:** A React `useEffect` will monitor the `targetState`. If a change is detected that creates a gap between current position and target, it will restart the rAF loop.

## 4. Implementation Details

### 4.1. `RobotCanvas` Component Changes
- **`bgCanvasRef`**: A `useRef<HTMLCanvasElement>` to store the offscreen background.
- **`drawBackground()`**: A function that performs all the static drawing logic currently inside the main `useEffect`.
- **`renderFrame()`**:
    1. `ctx.clearRect(0, 0, 500, 500)`
    2. `ctx.drawImage(bgCanvasRef.current, 0, 0)`
    3. `drawTrail()`
    4. `drawRobot()`

### 4.2. Animation Loop Logic
```typescript
const animate = () => {
  const isMoving = updateRobotState(); // Returns true if state changed
  
  renderFrame();

  if (isMoving) {
    animationFrameRef.current = requestAnimationFrame(animate);
  } else {
    animationFrameRef.current = null;
  }
};
```

## 5. Success Criteria
- **Idle State:** CPU usage for the browser tab drops significantly when the robot is not moving.
- **Movement State:** Rendering remains smooth (60fps) even with complex trails.
- **Correctness:** Grid and markers remain visible and sharp at all times.

## 6. Testing Strategy
- **Manual Verification:** Open Browser DevTools (Performance tab) and verify that "Scripting" and "Rendering" activity drops to near zero when the robot stops.
- **Visual Regression:** Ensure the background (grid/axes) looks identical to the current implementation.

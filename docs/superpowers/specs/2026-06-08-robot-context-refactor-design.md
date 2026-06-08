# Design Spec: Robot Context API Refactor

**Date:** 2026-06-08
**Topic:** Architecture & State Management Refactor
**Status:** Draft

## 1. Overview
The current "Robo-Coder Playground" application uses a "trigger" pattern (incremental counters like `executionTrigger`, `resetTrigger`) to coordinate state between `PlaygroundPage`, `CodeEditor`, and `RobotCanvas`. This leads to complex `useEffect` chains, prop drilling, and difficulty in managing execution lifecycle.

This refactor moves all robot-related state and logic into a centralized `RobotContext` using the React Context API.

## 2. Goals
- Centralize state management to eliminate "triggers" and prop drilling.
- Improve decoupling between the executor logic and the UI components.
- Simplify `RobotCanvas` to be a focused rendering component.
- Provide a scalable foundation for future features (e.g., sound, more commands).

## 3. Architecture

### 3.1. RobotProvider (`lib/contexts/robot-context.tsx`)
A new Context Provider that will hold:

**State:**
- `robotState`: `{ x: number, y: number, rotation: number }` (Current position for animation)
- `targetState`: `{ x: number, y: number, rotation: number }` (Desired position)
- `commands`: `string` (The raw code)
- `isExecuting`: `boolean`
- `currentLine`: `number` (The 0-indexed line being executed)
- `message`: `string` (Status message like "Moving 10 steps...")
- `trail`: `Array<{ x: number, y: number }>` (The movement path)

**Actions:**
- `runCommands()`: Calls the parser and starts the execution loop.
- `stopExecution()`: Interrupts the current execution loop.
- `resetRobot()`: Returns robot to (0,0) and clears the trail.
- `updateCommands(code: string)`: Updates the `commands` state.
- `clearAll()`: Resets commands, robot state, and trail.

### 3.2. Execution Lifecycle
The `executeCommands` logic will be integrated into the `RobotProvider`. Instead of passing `setRobotState` and other dispatchers directly to the executor, the provider will manage a `stopped` ref and coordinate updates to its own state.

## 4. Component Changes

### 4.1. `app/page.tsx`
- Remove all trigger states.
- Wrap the main playground UI in `<RobotProvider>`.
- Delegate command/execution handling to the context.

### 4.2. `components/robot-canvas.tsx`
- Use `useRobot()` to get `robotState`, `trail`, `message`, and `currentLine`.
- Remove internal `robotState`, `trail`, etc.
- Remove the `useEffect` that calls `executeCommands`.
- Keep the `canvas` drawing logic and the `requestAnimationFrame` loop for smoothing `robotState` towards `targetState`.

### 4.3. `components/code-editor.tsx`
- Use `useRobot()` to get `commands` and execution status.
- Call context actions for Run, Stop, Reset, and Clear.

## 5. Data Flow
1. User types in `CodeEditor` -> calls `updateCommands(code)`.
2. User clicks "Run" -> calls `runCommands()`.
3. `RobotProvider` parses code -> sets `isExecuting(true)`.
4. `RobotProvider` runs loop -> updates `targetState`, `message`, and `currentLine`.
5. `RobotCanvas` observes `robotState`/`targetState` updates and redraws.
6. Execution finishes -> `RobotProvider` sets `isExecuting(false)`.

## 6. Testing Strategy
- **Unit Tests:** The `parser.ts` and `executor.ts` (as pure functions) can be tested for command-to-state-change accuracy.
- **Integration Tests:** Verify that calling `runCommands()` updates the context state over time as expected.
- **Manual Verification:** Ensure the robot movement remains smooth and the "Stop" button instantly halts movement.

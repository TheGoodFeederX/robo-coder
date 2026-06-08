import { render, act } from '@testing-library/react'
import { expect, test, vi, beforeEach, describe } from 'vitest'
import { RobotCanvas } from '../robot-canvas'
import { useRobot } from '@/lib/contexts/robot-context'
import React from 'react'

// Mock the useRobot hook
vi.mock('@/lib/contexts/robot-context', () => ({
  useRobot: vi.fn(),
}))

describe('RobotCanvas Motion Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      ellipse: vi.fn(),
      roundRect: vi.fn(),
      fillText: vi.fn(),
      drawImage: vi.fn(),
      shadowBlur: 0,
      shadowColor: '',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      lineWidth: 1,
      strokeStyle: '',
      fillStyle: '',
      textAlign: 'center',
      textBaseline: 'middle',
      font: '',
      lineCap: 'round',
      lineJoin: 'round',
    }) as any

    // Mock requestAnimationFrame to execute immediately or via timers
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 0)))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => clearTimeout(id)))
    
    vi.useFakeTimers()
  })

  test('at target condition: distance threshold (0.1) stops animation', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    
    // 1. Initial State: Robot is at (250, 250)
    vi.mocked(useRobot).mockReturnValue({
      targetState: { x: 250, y: 250, rotation: 0 },
      trail: [],
      message: '',
      currentLine: -1,
      isExecuting: false,
    } as any)

    const { rerender } = render(<RobotCanvas />)
    
    // Clear initial calls from mounting
    act(() => {
      vi.runAllTimers()
    })
    rafSpy.mockClear()

    // 2. Move target to within threshold (dx = 0.05, dy = 0.05, dRotation = 0.05)
    // All are < 0.1
    vi.mocked(useRobot).mockReturnValue({
      targetState: { x: 250.05, y: 250.05, rotation: 0.05 },
      trail: [],
      message: '',
      currentLine: -1,
      isExecuting: true,
    } as any)

    act(() => {
      rerender(<RobotCanvas />)
    })

    // The useEffect for targetState triggers
    // It calls requestAnimationFrame(frame) -> 1st call
    expect(rafSpy).toHaveBeenCalledTimes(1)

    // Execute the first frame
    act(() => {
      vi.runOnlyPendingTimers()
    })

    // animate() should have returned false because distance < 0.1
    // So it should NOT have called requestAnimationFrame again
    expect(rafSpy).toHaveBeenCalledTimes(1)
  })

  test('at target condition: distance above threshold (0.1) continues animation', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    
    // 1. Initial State
    vi.mocked(useRobot).mockReturnValue({
      targetState: { x: 250, y: 250, rotation: 0 },
      trail: [],
      message: '',
      currentLine: -1,
      isExecuting: false,
    } as any)

    const { rerender } = render(<RobotCanvas />)
    
    act(() => {
      vi.runAllTimers()
    })
    rafSpy.mockClear()

    // 2. Move target beyond threshold (dx = 0.2)
    vi.mocked(useRobot).mockReturnValue({
      targetState: { x: 250.2, y: 250, rotation: 0 },
      trail: [],
      message: '',
      currentLine: -1,
      isExecuting: true,
    } as any)

    act(() => {
      rerender(<RobotCanvas />)
    })

    // The useEffect for targetState triggers
    // It calls requestAnimationFrame(frame) -> 1st call
    expect(rafSpy).toHaveBeenCalledTimes(1)

    // Execute the first frame
    act(() => {
      vi.runOnlyPendingTimers()
    })

    // animate() should have returned true because dx = 0.2 > 0.1
    // So it should have called requestAnimationFrame AGAIN -> 2nd call
    expect(rafSpy).toHaveBeenCalledTimes(2)
  })
})

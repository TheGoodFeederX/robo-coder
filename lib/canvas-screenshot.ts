export function captureCanvasScreenshot(canvasElement: HTMLCanvasElement): string {
  return canvasElement.toDataURL("image/png")
}

"use client";

import { useRef, useState, useEffect } from "react";
import { predict } from "../lib/api";

export default function DrawDigit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<{ digit: number; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 280, 280);
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const handleClear = () => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 280, 280);
    setResult(null);
  };

  const handlePredict = async () => {
    setLoading(true);
    const canvas = canvasRef.current!;
    // Downscale to 28x28
    const offscreen = document.createElement("canvas");
    offscreen.width = 28;
    offscreen.height = 28;
    const octx = offscreen.getContext("2d")!;
    octx.drawImage(canvas, 0, 0, 28, 28);
    const imageData = octx.getImageData(0, 0, 28, 28);
    // Extract grayscale, normalize
    const pixels: number[] = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      pixels.push((imageData.data[i] / 255.0 - 0.1307) / 0.3081);
    }
    try {
      const res = await predict(pixels);
      setResult(res);
    } catch {
      setResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-[#222] bg-[#141414] p-4">
      <h3 className="text-sm font-semibold text-[#888] mb-3">Test the Model — Draw a Digit</h3>
      <div className="flex flex-col items-center gap-3">
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="border border-[#333] rounded cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
        />
        <div className="flex gap-2">
          <button
            onClick={handlePredict}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "..." : "Predict"}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded text-sm"
          >
            Clear
          </button>
        </div>
        {result && (
          <div className="text-center">
            <p className="text-3xl font-bold">{result.digit}</p>
            <p className="text-sm text-[#888]">
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

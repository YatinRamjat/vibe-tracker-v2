"use client";

import { useState, useRef } from "react";
import { GlobalFoodCache } from "@/lib/supabase";

type InputCaptureProps = {
  onFoodFound: (food: GlobalFoodCache) => void;
};

export default function InputCapture({ onFoodFound }: InputCaptureProps) {
  const [query, setQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/log-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const json = await res.json();
      if (json.data) {
        onFoodFound(json.data);
        setQuery(""); // Clear on success
      } else {
        alert(json.error || "Food not found or failed to analyze.");
      }
    } catch (err) {
      console.error(err);
      alert("Error searching food.");
    } finally {
      setIsLoading(false);
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      alert("Camera access denied or unavailable");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Scale to max 1080px
    const maxDim = 1080;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.floor(height * (maxDim / width));
        width = maxDim;
      } else {
        width = Math.floor(width * (maxDim / height));
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    // 0.7 JPEG compression strictly
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.7);

    stopScanner();
    setIsLoading(true);

    try {
      const res = await fetch("/api/log-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const json = await res.json();
      if (json.data) {
        onFoodFound(json.data);
      } else {
        alert(json.error || "Failed to analyze image.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing image.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video
            ref={videoRef}
            className="flex-1 w-full h-full object-cover"
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
            <button
              onClick={stopScanner}
              className="text-white p-3 rounded-full bg-slate-800/50 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={captureImage}
              className="w-16 h-16 rounded-full border-4 border-emerald-500 bg-white/20 hover:bg-white/40 transition-colors"
            />
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>
      )}

      <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-emerald-500 transition-colors shadow-lg">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Describe your meal..."
          disabled={isLoading}
          className="flex-1 bg-transparent text-white px-4 py-4 focus:outline-none disabled:opacity-50"
        />

        {isLoading ? (
          <div className="px-4 text-emerald-500 animate-pulse text-sm font-medium">
            Analyzing...
          </div>
        ) : (
          <div className="flex px-2 space-x-1">
            <button
              onClick={handleSearch}
              className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
              title="Search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={startScanner}
              className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
              title="Scan Food"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

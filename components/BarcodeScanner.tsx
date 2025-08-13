"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";
import { stopAllCameraStreams, stopVideoStream } from "@/utils/cameraUtils";

// Aspect ratio and crop size factor
const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
const CROP_SIZE_FACTOR = 0.4;

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({ 
  onBarcodeDetected, 
  onError, 
  onClose, 
  isOpen 
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const codeReader = useRef(new BrowserMultiFormatReader());
  
  // Store callbacks in refs to prevent unnecessary re-renders
  const onBarcodeDetectedRef = useRef(onBarcodeDetected);
  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);
  
  // Track camera state to prevent multiple initializations
  const cameraInitializedRef = useRef(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const isCleaningUpRef = useRef(false);
  
  // Update refs when callbacks change
  useEffect(() => {
    onBarcodeDetectedRef.current = onBarcodeDetected;
    onErrorRef.current = onError;
    onCloseRef.current = onClose;
  }, [onBarcodeDetected, onError, onClose]);

  useEffect(() => {
    const stopCamera = () => {
      if (isCleaningUpRef.current) return; // Prevent multiple stops
      
      console.log("Stopping camera...");
      isCleaningUpRef.current = true;
      
      // Stop the current stream directly
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log("Stopped current stream track:", track.kind);
        });
        currentStreamRef.current = null;
      }
      
      // Stop the video stream
      stopVideoStream(videoRef.current);
      
      // Also stop all camera streams as a backup
      stopAllCameraStreams();
      
      // Clear the interval
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        console.log("Cleared interval");
      }
      
      // Reset state
      setIsScanning(false);
      setBarcodeResult(null);
      cameraInitializedRef.current = false;
      
      // Force video element cleanup
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }
      
      // Reset cleanup flag after a short delay
      setTimeout(() => {
        isCleaningUpRef.current = false;
      }, 100);
    };

    const startCamera = async () => {
      if (cameraInitializedRef.current || isCleaningUpRef.current) return;
      
      try {
        cameraInitializedRef.current = true;
        setIsScanning(true);
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        });
        currentStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            intervalIdRef.current = setInterval(captureFrameAndCrop, 100);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        const errorMessage = "Unable to access the camera. Please check permissions.";
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
        cameraInitializedRef.current = false;
      }
    };

    const captureFrameAndCrop = () => {
      if (!videoRef.current || !displayCroppedCanvasRef.current || !cropOverlayRef.current) return;

      const video = videoRef.current;
      const displayCanvas = displayCroppedCanvasRef.current;
      const displayContext = displayCanvas.getContext("2d", { willReadFrequently: true });
      const overlayDiv = cropOverlayRef.current;

      if (!displayContext) return;

      const tempCanvas = document.createElement("canvas");
      const tempContext = tempCanvas.getContext("2d", { willReadFrequently: true });
      if (!tempContext) return;

      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      let cropWidth, cropHeight;
      const videoRatio = video.videoWidth / video.videoHeight;

      if (videoRatio / DESIRED_CROP_ASPECT_RATIO > 1) {
        cropHeight = video.videoHeight * CROP_SIZE_FACTOR;
        cropWidth = cropHeight * DESIRED_CROP_ASPECT_RATIO;
      } else {
        cropWidth = video.videoWidth * CROP_SIZE_FACTOR;
        cropHeight = cropWidth / DESIRED_CROP_ASPECT_RATIO;
      }

      cropWidth = Math.min(cropWidth, video.videoWidth);
      cropHeight = Math.min(cropHeight, video.videoHeight);

      const MIN_CROP_WIDTH = 240;
      const MAX_CROP_WIDTH = 600;
      const MIN_CROP_HEIGHT = 80;
      const MAX_CROP_HEIGHT = 400;

      cropWidth = Math.max(MIN_CROP_WIDTH, Math.min(MAX_CROP_WIDTH, cropWidth));
      cropHeight = Math.max(MIN_CROP_HEIGHT, Math.min(MAX_CROP_HEIGHT, cropHeight));

      const cropX = (video.videoWidth - cropWidth) / 2;
      const cropY = (video.videoHeight - cropHeight) / 2;

      displayCanvas.width = cropWidth;
      displayCanvas.height = cropHeight;

      displayContext.drawImage(
        tempCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      overlayDiv.style.position = 'absolute';
      overlayDiv.style.left = `${(cropX / video.videoWidth) * 100}%`;
      overlayDiv.style.top = `${(cropY / video.videoHeight) * 100}%`;
      overlayDiv.style.width = `${(cropWidth / video.videoWidth) * 100}%`;
      overlayDiv.style.height = `${(cropHeight / video.videoHeight) * 100}%`;
      overlayDiv.style.border = '2px solid white';
      overlayDiv.style.borderRadius = '0.5rem';
      overlayDiv.style.pointerEvents = 'none';
      overlayDiv.style.boxSizing = 'border-box';

      const decodeCanvas = async () => {
        try {
          const result: Result = await codeReader.current.decodeFromCanvas(displayCanvas);
          const barcodeText = result.getText();
          console.log("Decoded barcode:", barcodeText);
          setBarcodeResult(barcodeText);
          onBarcodeDetectedRef.current(barcodeText);
          // Automatically close the scanner when barcode is detected
          onCloseRef.current?.();
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "NotFoundException") {
            console.error("Decoding error:", err);
          }
        }
      };

      decodeCanvas();
    };

    // Only run camera logic if the component is actually mounted and visible
    if (!isOpen) {
      // If modal is closed and camera is running, stop it
      if (cameraInitializedRef.current && !isCleaningUpRef.current) {
        stopCamera();
      }
      return;
    }

    // If modal is open and camera is not running, start it
    if (!cameraInitializedRef.current && !isCleaningUpRef.current) {
      startCamera();
    }

    // Cleanup function for component unmount
    return () => {
      if (cameraInitializedRef.current && !isCleaningUpRef.current) {
        console.log("Component unmounting, stopping camera...");
        stopCamera();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">
              Scan Barcode
            </h2>
            <button
              onClick={onCloseRef.current}
              className="text-gray-500 hover:text-gray-700 text-2xl p-1"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-gray-100">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div
              ref={cropOverlayRef}
              className="absolute border-2 border-white rounded-lg pointer-events-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Position the barcode within the white border to scan
            </p>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800">
                Scanned Barcode:
              </h3>

              <canvas
                ref={displayCroppedCanvasRef}
                className="border-2 border-blue-500 rounded-lg shadow-lg w-full max-w-xs h-auto block mx-auto"
                style={{ minHeight: '60px' }}
              />
            </div>

            {barcodeResult && (
              <div className="p-3 bg-green-100 border-2 border-dashed border-green-500 rounded-lg">
                <div className="text-green-800 font-medium text-center text-sm">
                  ✅ Barcode: {barcodeResult}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Canvas updates every 0.1 seconds with the focused area
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={onCloseRef.current}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Close Scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import BarcodeScanner from "./BarcodeScanner";

interface BarcodeInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  onBarcodeDetected?: (barcode: string) => void;
}

export default function BarcodeInput({ 
  value,
  onChange,
  placeholder = "Enter barcode...",
  className = "",
  onBarcodeDetected
}: BarcodeInputProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  const handleBarcodeDetected = (barcode: string) => {
    setInputValue(barcode);
    onChange?.(barcode);
    onBarcodeDetected?.(barcode);
    setIsScannerOpen(false);
  };

  const handleScannerError = (error: string) => {
    console.error("Scanner error:", error);
  };

  const handleCloseScanner = () => {
    console.log("BarcodeInput: Closing scanner...");
    setIsScannerOpen(false);
  };

  // Update local state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      if (isScannerOpen) {
        console.log("BarcodeInput: Component unmounting, closing scanner...");
        setIsScannerOpen(false);
      }
    };
  }, []);

  return (
    <>
      <div className={`flex items-center gap-2 text-black space-x-1 sm:space-x-2 ${className}`}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange?.(e.target.value);
          }}
          placeholder={placeholder}
          className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => setIsScannerOpen(true)}
          className="px-2 py-1.5 sm:px-3 sm:py-2 bg-[#DDDDDD] text-gray-900 rounded-md hover:bg-[#CFCFCF] transition-colors flex items-center justify-center min-w-[40px] sm:min-w-[44px]"
          title="Scan barcode"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
            />
          </svg>
        </button>
      </div>

      <BarcodeScanner
        isOpen={isScannerOpen}
        onBarcodeDetected={handleBarcodeDetected}
        onError={handleScannerError}
        onClose={handleCloseScanner}
      />
    </>
  );
} 
"use client";

import { useState, useEffect } from "react";
import BarcodeScanner from "./BarcodeScanner";

interface BarcodeSearchProps {
  onBarcodeSearch: (barcode: string) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function BarcodeSearch({ 
  onBarcodeSearch, 
  placeholder = "Search by barcode...",
  className = "",
  value,
  onChange
}: BarcodeSearchProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value || "");

  const handleBarcodeDetected = (barcode: string) => {
    setSearchValue(barcode);
    onChange?.(barcode);
    onBarcodeSearch(barcode);
    setIsScannerOpen(false);
  };

  const handleScannerError = (error: string) => {
    console.error("Scanner error:", error);
    // You can add a toast notification here if needed
  };

  const handleCloseScanner = () => {
    setIsScannerOpen(false);
  };

  const handleManualSearch = () => {
    if (searchValue.trim()) {
      onChange?.(searchValue.trim());
      onBarcodeSearch(searchValue.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  };

  // Update local state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSearchValue(value);
    }
  }, [value]);

  return (
    <>
      <div className={`relative ${className}`}>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => setIsScannerOpen(true)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 transition-colors bg-white rounded-md hover:bg-gray-50"
          title="Scan barcode"
        >
          <svg
            className="w-5 h-5"
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
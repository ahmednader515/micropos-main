'use client'

import { useState } from 'react'
import BarcodeScanner from '@/components/BarcodeScanner'

export default function BarcodeDemoPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)

  const handleBarcodeDetected = (barcode: string) => {
    setScannedBarcode(barcode)
    setIsScannerOpen(false)
  }

  const handleScannerError = (error: string) => {
    console.error('Scanner error:', error)
    alert(`Scanner error: ${error}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Barcode Scanner Demo
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test the Barcode Scanner
          </h2>
          
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Barcode Scanner
          </button>

          {scannedBarcode && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Scanned Barcode:</h3>
              <p className="text-green-700 font-mono">{scannedBarcode}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Instructions
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Click the "Open Barcode Scanner" button to start scanning</li>
            <li>Position a barcode within the white border on the camera view</li>
            <li>The scanner will automatically detect and decode the barcode</li>
            <li>You can also manually enter barcode numbers</li>
            <li>The scanner supports various barcode formats including QR codes</li>
          </ul>
        </div>
      </div>

      <BarcodeScanner
        isOpen={isScannerOpen}
        onBarcodeDetected={handleBarcodeDetected}
        onError={handleScannerError}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  )
} 
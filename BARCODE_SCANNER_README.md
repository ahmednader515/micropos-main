# Barcode Scanner Components

This project includes barcode scanning functionality using the ZXing library. The implementation provides two main components:

## Components

### 1. BarcodeScanner
A modal camera-based barcode scanner component.

**Props:**
- `isOpen: boolean` - Controls whether the scanner modal is open
- `onBarcodeDetected: (barcode: string) => void` - Callback when a barcode is detected
- `onError?: (error: string) => void` - Optional callback for scanner errors
- `onClose?: () => void` - Optional callback when the scanner is closed

**Features:**
- Real-time camera feed with cropping overlay
- Automatic barcode detection every 100ms
- Supports multiple barcode formats (QR, Code128, EAN, etc.)
- Responsive design with mobile optimization
- Error handling for camera permissions

### 2. BarcodeSearch
A search input component with integrated barcode scanning.

**Props:**
- `onBarcodeSearch: (barcode: string) => void` - Callback when barcode is searched
- `placeholder?: string` - Input placeholder text
- `className?: string` - Additional CSS classes
- `value?: string` - Controlled input value
- `onChange?: (value: string) => void` - Callback for value changes

**Features:**
- Text input for manual barcode entry
- Camera scanner button
- Enter key support for search
- Integrated with BarcodeScanner component

## Usage Examples

### Basic Scanner Usage
```tsx
import BarcodeScanner from '@/components/BarcodeScanner'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleBarcodeDetected = (barcode: string) => {
    console.log('Detected barcode:', barcode)
    setIsOpen(false)
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Scan Barcode
      </button>
      
      <BarcodeScanner
        isOpen={isOpen}
        onBarcodeDetected={handleBarcodeDetected}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
```

### Search Component Usage
```tsx
import BarcodeSearch from '@/components/BarcodeSearch'

function ProductSearch() {
  const handleBarcodeSearch = (barcode: string) => {
    // Search for product with this barcode
    searchProduct(barcode)
  }

  return (
    <BarcodeSearch
      onBarcodeSearch={handleBarcodeSearch}
      placeholder="Search by barcode..."
    />
  )
}
```

### Form Integration
```tsx
import BarcodeSearch from '@/components/BarcodeSearch'

function ProductForm() {
  const [formData, setFormData] = useState({ barcode: '' })

  const handleBarcodeDetected = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }))
  }

  return (
    <form>
      <label>Barcode:</label>
      <BarcodeSearch
        onBarcodeSearch={handleBarcodeDetected}
        value={formData.barcode}
        onChange={(value) => setFormData(prev => ({ ...prev, barcode: value }))}
        placeholder="Enter barcode manually or scan"
      />
    </form>
  )
}
```

## Integration Points

### Products Page
The barcode scanner is integrated into the products page (`/inventory/products`) with:
- Search by barcode functionality
- Manual input and camera scanning options
- Automatic search when barcode is detected

### New Product Page
The barcode scanner is integrated into the new product form (`/inventory/new-product`) with:
- Barcode field with scanner integration
- Manual input and camera scanning options
- Automatic form population when barcode is detected

## Demo Page
A demo page is available at `/barcode-demo` to test the scanner functionality.

## Technical Details

### Dependencies
- `@zxing/browser` - Browser-based barcode reading
- `@zxing/library` - Core barcode detection library

### Browser Support
- Requires HTTPS for camera access
- Supports modern browsers with WebRTC
- Mobile-optimized for camera access

### Camera Permissions
The scanner will request camera permissions when opened. Users must grant permission for the scanner to work.

### Error Handling
- Camera permission denied
- No camera available
- Barcode not found in frame
- Network errors

## Installation

The required dependencies are already installed:
```bash
npm install @zxing/browser @zxing/library
```

## Troubleshooting

1. **Camera not working**: Ensure HTTPS is enabled and camera permissions are granted
2. **Scanner not detecting**: Make sure the barcode is clearly visible within the white border
3. **Mobile issues**: Test on a physical device, not just browser dev tools
4. **Performance**: The scanner runs every 100ms, adjust if needed for performance

## Customization

You can customize the scanner by modifying:
- `DESIRED_CROP_ASPECT_RATIO` - Change the crop area aspect ratio
- `CROP_SIZE_FACTOR` - Adjust the size of the crop area
- Scanning interval (currently 100ms)
- UI styling and colors 
# microPOS - Point of Sale System

A modern web-based point-of-sale (POS) system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Modern UI**: Clean, responsive design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Next.js App Router**: Latest Next.js 14 with App Router
- **Modular Components**: Reusable and maintainable component structure
- **Responsive Layout**: Fixed sidebar with main content area

## Pages & Navigation

- **Dashboard**: Overview with key metrics and recent activity
- **Products**: Product inventory management with table view
- **Customers**: Customer database management (placeholder)
- **Sales**: Sales tracking and transactions (placeholder)
- **Expenses**: Business expense tracking (placeholder)
- **Reports**: Analytics and reporting (placeholder)
- **Settings**: System configuration (placeholder)

## Product Management

The products page includes:
- Product table with name, category, price, stock, and status
- Stock status indicators (In Stock, Low Stock, Out of Stock)
- "New Product" button linking to `/products/new`
- Product creation form with all necessary fields

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
microPOS/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard page
│   └── products/          # Product pages
│       ├── page.tsx       # Products list
│       └── new/           # New product form
├── components/            # Reusable components
│   ├── MainLayout.tsx     # Main layout with sidebar
│   └── Sidebar.tsx        # Navigation sidebar
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md             # Project documentation
```

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React 18**: Latest React features

## Development

The application uses a modular component structure with:
- Reusable `MainLayout` component for consistent layout
- `Sidebar` component with navigation links
- TypeScript interfaces for type safety
- Tailwind CSS for styling

## Future Enhancements

- Database integration
- User authentication
- Real-time updates
- Advanced reporting
- Mobile responsiveness improvements
- API endpoints for CRUD operations

## License

This project is open source and available under the MIT License. 
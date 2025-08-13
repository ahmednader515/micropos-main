'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

interface MenuOption {
  label: string
  onClick: () => void
}

interface MainLayoutProps {
  children: React.ReactNode
  navbarTitle?: string
  onBack?: () => void
  menuOptions?: MenuOption[]
  hideNavbar?: boolean
}

export default function MainLayout({ children, navbarTitle, onBack, menuOptions, hideNavbar }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100 flex-row-reverse">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        {!hideNavbar && (
          <div className={`sticky top-0 z-30 shadow-sm lg:hidden ${navbarTitle ? 'bg-white' : 'bg-gradient-to-l from-blue-600 to-purple-600'}`}>
            {navbarTitle ? (
              <div className="flex items-center justify-between px-2 py-3 relative">
                {/* Back button */}
                <button
                  onClick={onBack}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 px-2"
                  style={{ minWidth: 40 }}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {/* Title */}
                <div className="flex-1 flex justify-center">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">{navbarTitle}</h1>
                </div>
                {/* Menu button */}
                <div className="relative" style={{ minWidth: 40 }}>
                  {menuOptions && menuOptions.length > 0 ? (
                    <>
                      <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 px-2"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="19.5" cy="12" r="1.5" />
                          <circle cx="4.5" cy="12" r="1.5" />
                        </svg>
                      </button>
                      {menuOpen && (
                        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                          {menuOptions.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setMenuOpen(false)
                                option.onClick()
                              }}
                              className="block w-full text-right px-4 py-2 text-gray-900 hover:bg-gray-100 text-sm"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-row-reverse items-center justify-between px-4 py-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-white hover:text-gray-100 focus:outline-none focus:text-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-white">microPOS</h1>
                <div className="w-6"></div> {/* Spacer for centering */}
              </div>
            )}
          </div>
        )}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
} 
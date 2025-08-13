import MainLayout from '@/components/MainLayout'

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Configure your system preferences</p>
        </div>
        
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-gray-500">Settings functionality coming soon...</p>
        </div>
      </div>
    </MainLayout>
  )
} 
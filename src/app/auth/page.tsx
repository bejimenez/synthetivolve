// src/app/auth/page.tsx
'use client'

import { useState } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const toggleMode = () => {
    setMode(prev => prev === 'signin' ? 'signup' : 'signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Synthetivolve</h1>
          <p className="text-gray-600">Your personalized health and wellness companion</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm mode={mode} onToggleMode={toggleMode} />
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Start your journey to better health with data-driven insights
        </p>
      </div>
    </div>
  )
}
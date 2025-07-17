// src/components/dashboard/shared/CircularProgress.tsx
'use client'

import React from 'react'

interface CircularProgressProps {
  value: number
  max: number
  label: string
  unit: string
  color: string
  size?: number
  strokeWidth?: number
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  label,
  unit,
  color,
  size = 120,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = max > 0 ? (value / max) * circumference : 0
  const offset = circumference - progress

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-gray-200 dark:stroke-gray-700"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={color}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {Math.round(value)}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <span className="font-semibold">{label}</span>
    </div>
  )
}

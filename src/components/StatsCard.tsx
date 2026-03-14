"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  icon,
  iconColor = "var(--info)",
  trend,
}: StatsCardProps) {
  return (
    <div 
      className="rounded-xl p-4 md:p-6 group transition-all duration-200"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = iconColor;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${iconColor}30`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <div className="flex items-center justify-between mb-1.5 md:mb-2">
        <span 
          className="text-xs md:text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {title}
        </span>
        {/* Icon with glow backing */}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5"
          style={{ 
            color: iconColor,
            backgroundColor: `${iconColor}18`,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span 
          className="text-2xl md:text-3xl font-bold tracking-tight"
          style={{ 
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)',
            letterSpacing: '-1.5px'
          }}
        >
          {value}
        </span>
        {trend && (
          <span
            className="text-xs md:text-sm font-medium"
            style={{ color: trend.isPositive ? 'var(--success)' : 'var(--error)' }}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}

'use client';

import clsx from 'clsx';

// Enhanced helper component for info display
const InfoCard = ({ 
  label, 
  value, 
  mono = false, 
  icon,
  highlight = false,
  locale 
}: { 
  label: string; 
  value: string; 
  mono?: boolean;
  icon?: React.ReactNode;
  highlight?: boolean;
  locale?: string;
}) => (
  <div className={clsx(
    "group relative p-5 rounded-xl border transition-all duration-200 hover:shadow-md",
    highlight 
      ? "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-300" 
      : "bg-white border-gray-200 hover:border-gray-300"
  )}>
    {/* Subtle gradient overlay on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div className={clsx(
            "p-1 rounded-md",
            highlight ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
          )}>
            {icon}
          </div>
        )}
        <div className={clsx(
          `${locale === 'ar' ? 'text-xs font-medium' : 'text-xs font-semibold'} uppercase tracking-wider`,
          highlight ? "text-blue-700" : "text-gray-600"
        )}>
          {label}
        </div>
      </div>
      
      <div className={clsx(
        `${locale === 'ar' ? 'text-xs font-semibold' : 'text-sm font-bold'} break-words`,
        mono && "font-mono text-xs",
        highlight ? "text-blue-900" : "text-gray-900"
      )}>
        {value || (
          <span className="text-gray-400 italic">
            Not provided
          </span>
        )}
      </div>
    </div>
  </div>
);

export default InfoCard;

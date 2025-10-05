'use client';

import clsx from 'clsx';

// Minimized info display component
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
    "p-3 rounded-lg border transition-colors hover:bg-muted/30",
    highlight 
      ? "bg-primary/5 border-primary/20" 
      : "bg-card border-border"
  )}>
    <div className="flex items-center gap-2 mb-1">
      {icon && (
        <div className="w-4 h-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
    
    <div className={clsx(
      "text-sm font-semibold text-foreground break-words",
      mono && "font-mono text-xs"
    )}>
      {value || (
        <span className="text-muted-foreground/60 italic text-xs">
          Not provided
        </span>
      )}
    </div>
  </div>
);

export default InfoCard;

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  variant?: 'default' | 'primary' | 'accent';
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  className,
  variant = 'default'
}: StatCardProps) {
  return (
    <div 
      className={cn(
        'p-6 rounded-2xl border transition-all duration-300 hover:shadow-card animate-in',
        variant === 'default' && 'bg-card border-border',
        variant === 'primary' && 'gradient-primary border-primary/20 text-primary-foreground',
        variant === 'accent' && 'gradient-accent border-accent/20 text-accent-foreground',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-sm font-medium',
            variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
          )}>
            {title}
          </p>
          <p className="text-3xl font-display font-bold mt-2 animate-count">
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-sm mt-1',
              variant === 'default' ? 'text-muted-foreground' : 'opacity-70'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'p-3 rounded-xl',
            variant === 'default' && 'bg-primary/10 text-primary',
            variant === 'primary' && 'bg-primary-foreground/20',
            variant === 'accent' && 'bg-accent-foreground/20'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

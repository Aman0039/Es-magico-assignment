import React from 'react';
import { cn, getInitials, getAvatarColor } from '../../lib/utils';

export const Avatar = ({ user, size = 'md', className }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg'
  };

  const name = user?.name || '?';
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none',
      colorClass,
      sizes[size],
      className
    )}>
      {initials}
    </div>
  );
};

export const AvatarGroup = ({ users = [], max = 4, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const rest = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <div key={user._id || i} className="ring-2 ring-background rounded-full" title={user.name}>
          <Avatar user={user} size={size} />
        </div>
      ))}
      {rest > 0 && (
        <div className={cn(
          'ring-2 ring-background rounded-full flex items-center justify-center bg-muted text-muted-foreground font-medium text-xs',
          size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
        )}>
          +{rest}
        </div>
      )}
    </div>
  );
};

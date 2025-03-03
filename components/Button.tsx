'use client';
import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children?: React.ReactNode; // Text content (optional)
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  iconPosition?: 'top' | 'left' | 'right' | 'bottom';
  className?: string; 
}

// Static styles
const baseStyles =
  'py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center w-full bg-[var(--button-background)] text-[var(--button-text)]';
const hoverStyles = 'hover:opacity-70';
const disabledStyles = 'opacity-50 cursor-not-allowed';

// Button component
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  href,
  disabled = false,
  icon,
  type = 'button',
  iconPosition = 'top',
  className = '',
}) => {
  // Determine flex direction based on icon position
  let flexDirection = 'flex-col'; // Default to icon on top

  switch (iconPosition) {
    case 'left':
      flexDirection = 'flex-row'; // Icon on the left
      break;
    case 'right':
      flexDirection = 'flex-row-reverse'; // Icon on the right
      break;
    case 'bottom':
      flexDirection = 'flex-col-reverse'; // Icon on the bottom
      break;
  }

  // If there is only an icon, center it properly
  const isIconOnly = !children;
  const contentStyles = isIconOnly ? 'flex items-center justify-center' : `flex ${flexDirection} items-center gap-2`;

  // Combine styles based on conditions
  const combinedStyles = `${baseStyles} ${!disabled ? hoverStyles : ''} ${disabled ? disabledStyles : ''} ${className || ''}`;

  // Button content structure
  const ButtonContent = (
    <div className={contentStyles}>
      {icon && <span>{icon}</span>}
      {children && <span>{children}</span>}
    </div>
  );

  // If href is provided and button is not disabled, render a Link
  if (href && !disabled) {
    return (
      <Link href={href} className={combinedStyles}>
        {ButtonContent}
      </Link>
    );
  }

  // Default button
  return (
    <button onClick={onClick} className={combinedStyles} disabled={disabled} type={type}>
      {ButtonContent}
    </button>
  );
};

export default Button;

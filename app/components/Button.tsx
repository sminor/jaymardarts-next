'use client';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  href,
  className,
  disabled = false, // Default to false
  icon,
  size = 'medium', // Default to medium
}) => {
  const baseStyles =
    'py-2 px-4 rounded-md transition-colors duration-300 flex flex-col items-center justify-center w-full transition-opacity bg-[var(--button-background)] text-[var(--button-text)]';

  const hoverStyle = !disabled ? 'hover:opacity-70' : '';

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const focusStyles = 'focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeStyles = {
    // New size styles
    small: 'text-sm py-1 px-2',
    medium: 'text-base py-2 px-4',
    large: 'text-lg py-3 px-6',
  };

  const combinedStyles = `${baseStyles} ${hoverStyle} ${disabledStyles} ${focusStyles} ${sizeStyles[size]} ${className}`; //added focusstyles here

  const ButtonContent = (
    <div className="flex flex-col items-center justify-center">
      {icon && <div className="mb-2">{icon}</div>}
      {children} {/* Render children directly */}
    </div>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedStyles}>
        {ButtonContent}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={combinedStyles} disabled={disabled}>
      {ButtonContent}
    </button>
  );
};

export default Button;

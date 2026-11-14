import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}) => {
  // Classes de base communes à tous les boutons
  const baseClasses = "font-bold rounded-lg border transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Tailles
  const sizeClasses = size === 'sm' 
    ? "text-xs px-3 py-1.5" 
    : "text-sm px-4 py-2";
    
  // Variantes de couleurs
  const variantClasses = {
    primary: "bg-gradient-to-b from-cyan-400 to-cyan-600 border-cyan-300 text-slate-900 hover:shadow-[0_0_20px_rgba(0,243,255,0.6)] hover:-translate-y-0.5",
    ghost: "bg-bowling-panel border-bowling-line text-slate-200 hover:border-bowling-neon hover:text-white hover:shadow-[0_0_12px_rgba(0,243,255,0.3)] hover:-translate-y-0.5",
    danger: "bg-transparent border-bowling-line text-red-400 hover:border-red-400 hover:text-red-300 hover:bg-red-900/20"
  };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
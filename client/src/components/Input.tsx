import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, icon, id, className, ...props }: InputProps) => {
  return (
    <div className="relative group">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1 ml-1 group-focus-within:text-primary transition-colors">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full bg-white/5 border border-white/10 rounded-lg ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all ${className || ''}`}
          {...props}
        />
      </div>
    </div>
  );
};

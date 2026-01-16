"use client";

import { useState, useEffect } from "react";

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  currency?: string;
  locale?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  placeholder = "0",
  className = "",
  currency = "IDR",
  locale = "id-ID",
}: CurrencyInputProps) {
  // Format number to currency display
  const formatDisplay = (num: number): string => {
    if (num === 0) return "";
    return new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const [displayValue, setDisplayValue] = useState(formatDisplay(value));

  useEffect(() => {
    setDisplayValue(formatDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Remove all non-digit characters
    const cleaned = input.replace(/\D/g, "");
    
    // Parse to number
    const numValue = cleaned ? parseInt(cleaned, 10) : 0;
    
    // Update display with formatted value
    setDisplayValue(cleaned ? formatDisplay(numValue) : "");
    
    // Notify parent
    onChange(numValue);
  };

  const handleBlur = () => {
    // Ensure display is properly formatted on blur
    setDisplayValue(formatDisplay(value));
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
          {currency}
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-14 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-all text-right ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          } ${disabled ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "bg-white"}`}
        />
      </div>
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

// Helper function to format currency for display (non-input)
export function formatCurrencyDisplay(amount: number, currency = "IDR", locale = "id-ID"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

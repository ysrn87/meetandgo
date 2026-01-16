"use client";

import { useState, useEffect } from "react";

interface KTPInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function KTPInput({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  className = "",
}: KTPInputProps) {
  const [localError, setLocalError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Only allow digits
    const cleaned = input.replace(/\D/g, "");
    
    // Limit to 16 digits
    const limited = cleaned.slice(0, 16);
    
    // Validate
    if (limited.length > 0 && limited.startsWith("0")) {
      setLocalError("KTP cannot start with 0");
    } else if (limited.length > 0 && limited.length < 16) {
      setLocalError(`KTP must be 16 digits (${limited.length}/16)`);
    } else {
      setLocalError("");
    }
    
    onChange(limited);
  };

  const displayError = error || localError;
  const isValid = value.length === 16 && !value.startsWith("0");

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="3171234567890001"
          maxLength={16}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all font-mono tracking-wider ${
            displayError
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : isValid
              ? "border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              : "border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          } ${disabled ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "bg-white"}`}
        />
        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
          isValid ? "text-primary-500" : "text-slate-400"
        }`}>
          {value.length}/16
        </span>
      </div>
      {hint && !displayError && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
      {displayError && (
        <p className="mt-1.5 text-xs text-red-500">{displayError}</p>
      )}
    </div>
  );
}

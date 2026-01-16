"use client";

import { useState, useEffect } from "react";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "@/lib/validations";

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  placeholder = "81234567890",
  className = "",
}: PhoneInputProps) {
  // Extract country code and number from value
  const getInitialCountryCode = () => {
    for (const cc of COUNTRY_CODES) {
      if (value.startsWith(cc.code)) {
        return cc.code;
      }
    }
    return DEFAULT_COUNTRY_CODE;
  };

  const getInitialNumber = () => {
    for (const cc of COUNTRY_CODES) {
      if (value.startsWith(cc.code)) {
        return value.slice(cc.code.length);
      }
    }
    return value.replace(/^\+?\d{2,3}/, "");
  };

  const [countryCode, setCountryCode] = useState(getInitialCountryCode);
  const [number, setNumber] = useState(getInitialNumber);

  useEffect(() => {
    // Update parent with full phone number
    if (number) {
      onChange(countryCode + number);
    } else {
      onChange("");
    }
  }, [countryCode, number]);

  // Sync from parent value changes
  useEffect(() => {
    if (value) {
      for (const cc of COUNTRY_CODES) {
        if (value.startsWith(cc.code)) {
          setCountryCode(cc.code);
          setNumber(value.slice(cc.code.length));
          return;
        }
      }
    } else {
      setNumber("");
    }
  }, [value]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const cleaned = e.target.value.replace(/\D/g, "");
    setNumber(cleaned);
  };

  const selectedCountry = COUNTRY_CODES.find(cc => cc.code === countryCode);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          disabled={disabled}
          className="px-3 py-2.5 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          {COUNTRY_CODES.map((cc) => (
            <option key={cc.code} value={cc.code}>
              {cc.code} ({cc.country})
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={15}
          className={`flex-1 px-4 py-2.5 rounded-r-lg border text-sm outline-none transition-all ${
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
      {selectedCountry && (
        <p className="mt-1 text-xs text-slate-400">
          {selectedCountry.minLength}-{selectedCountry.maxLength} digits for {selectedCountry.country}
        </p>
      )}
    </div>
  );
}

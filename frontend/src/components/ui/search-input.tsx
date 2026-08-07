"use client";

import { Input } from "@/components/ui/input";
import { LoaderCircle, Search } from "lucide-react";
import React, { useEffect, useId, useState } from "react";

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value = "",
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onClick,
  placeholder = "Search notes, subjects, or AI knowledge...",
  className = ""
}: SearchInputProps) {
  const id = useId();
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (inputValue) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (onChange) {
      onChange(val);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <Input
        id={id}
        className="peer ps-9 border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-800"
        placeholder={placeholder}
        type="search"
        value={inputValue}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onClick={onClick}
        autoComplete="off"
      />
      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-slate-400 peer-disabled:opacity-50">
        {isLoading ? (
          <LoaderCircle
            className="animate-spin text-slate-700"
            size={16}
            strokeWidth={2}
            role="status"
            aria-label="Loading..."
          />
        ) : (
          <Search size={16} strokeWidth={2} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

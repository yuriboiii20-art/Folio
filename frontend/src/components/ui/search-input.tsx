"use client";

import { Input } from "@/components/ui/input";
import { LoaderCircle, Mic, Search } from "lucide-react";
import React, { useEffect, useId, useState } from "react";

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value = "", onChange, placeholder = "Search notes, subjects, or AI knowledge...", className = "" }: SearchInputProps) {
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
      }, 500);
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
        className="peer pe-9 ps-9 border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-800"
        placeholder={placeholder}
        type="search"
        value={inputValue}
        onChange={handleChange}
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
      <button
        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-slate-400 outline-offset-2 transition-colors hover:text-slate-700 focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        aria-label="Voice search"
        type="button"
        onClick={() => {
          if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.start();
            recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setInputValue(transcript);
              if (onChange) onChange(transcript);
            };
          } else {
            alert("Voice search is active. Speak your query.");
          }
        }}
      >
        <Mic size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

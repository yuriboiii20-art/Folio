import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

/**
 * GlassSelect
 * ---------------------------------------------------------------------------
 * A drop-in replacement for a native <select> whose popup can actually be
 * styled. Browsers render native option lists through the OS, so no amount of
 * CSS gives them blur, translucency or rounded corners — this renders its own
 * listbox instead.
 *
 * The panel is portalled to <body> with fixed positioning so it is never
 * clipped by the `overflow-hidden` card or the scrolling form column it sits
 * inside, stays glued to the trigger while the page scrolls, and sizes itself
 * to whatever room the viewport actually has.
 */

export interface GlassSelectOption {
  value: string;
  label: string;
}

export interface GlassSelectProps {
  id?: string;
  value: string;
  options: GlassSelectOption[];
  onChange: (value: string) => void;
  /** Classes for the trigger button. */
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
}

/** Kept in step with the panel transition below. */
const TRANSITION_MS = 200;
const STAGGER_MS = 16;
const PANEL_MAX_HEIGHT = 260;
/** Below this the panel is too cramped to be useful, so prefer the other side. */
const PANEL_COMFORT_HEIGHT = 160;
/** Never render shorter than this, even in a tiny viewport. */
const PANEL_FLOOR_HEIGHT = 88;
const VIEWPORT_MARGIN = 12;
const TRIGGER_GAP = 6;

interface PanelPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  dropUp: boolean;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  id,
  value,
  options,
  onChange,
  className = '',
  disabled = false,
  placeholder = 'Select...',
  'aria-label': ariaLabel
}) => {
  const listboxId = `${useId()}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex(o => o.value === value);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);   // panel present in the DOM
  const [entered, setEntered] = useState(false);   // panel transitioned in
  const [settled, setSettled] = useState(false);   // entry finished; drop delays
  const [activeIndex, setActiveIndex] = useState(selectedIndex < 0 ? 0 : selectedIndex);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  /** Measure the trigger and fit the panel into the room actually available. */
  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - TRIGGER_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - TRIGGER_GAP - VIEWPORT_MARGIN;

    // Flip upward only when below is genuinely cramped and above is roomier.
    const dropUp = spaceBelow < PANEL_COMFORT_HEIGHT && spaceAbove > spaceBelow;
    const available = dropUp ? spaceAbove : spaceBelow;

    // Fit the room we actually have — never force a height that overflows.
    const maxHeight = Math.max(
      PANEL_FLOOR_HEIGHT,
      Math.min(PANEL_MAX_HEIGHT, Math.floor(available))
    );

    // Never wider than the viewport on very small screens.
    const width = Math.min(rect.width, window.innerWidth - VIEWPORT_MARGIN * 2);
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.left),
      window.innerWidth - width - VIEWPORT_MARGIN
    );

    setPosition({
      top: dropUp ? rect.top - TRIGGER_GAP : rect.bottom + TRIGGER_GAP,
      left,
      width,
      maxHeight,
      dropUp
    });
  }, []);

  // Mount on open, then flip to the entered state on the next frame so the
  // browser has a "from" style to transition out of. On close, play the exit
  // first and only then unmount.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }

    setEntered(false);
    const timer = window.setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Once the cascade has finished, clear the per-row delays so hover and
  // keyboard highlighting react instantly.
  useEffect(() => {
    if (!entered) {
      setSettled(false);
      return;
    }
    const timer = window.setTimeout(
      () => setSettled(true),
      TRANSITION_MS + Math.min(options.length, 9) * STAGGER_MS
    );
    return () => window.clearTimeout(timer);
  }, [entered, options.length]);

  // Position before the first paint, then stay glued to the trigger.
  useLayoutEffect(() => {
    if (!mounted) return;
    measure();

    const reposition = () => measure();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [mounted, measure]);

  // Dismiss on outside click
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Reveal the highlighted row when navigating by keyboard
  useEffect(() => {
    if (!open) return;
    const node = panelRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const openList = () => {
    if (disabled) return;
    setActiveIndex(selectedIndex < 0 ? 0 : selectedIndex);
    setOpen(true);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(activeIndex);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const selectedLabel = options[selectedIndex]?.label;
  const dropUp = position?.dropUp ?? false;

  return (
    <>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full h-9 items-center justify-between gap-2 rounded-xl border bg-slate-800/70 px-2.5 text-left text-xs text-slate-100 backdrop-blur-md transition-all duration-200 ease-out hover:bg-slate-800/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${
          open ? 'border-blue-400/50 bg-slate-800/90' : 'border-white/10 hover:border-white/25'
        } ${className}`}
      >
        <span className={`truncate ${selectedLabel ? '' : 'text-slate-400'}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-slate-400 transition-transform duration-200 ease-out motion-reduce:transition-none ${
            open ? 'rotate-180 text-blue-300' : ''
          }`}
        />
      </button>

      {mounted && position && createPortal(
        <div
          ref={panelRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={`${listboxId}-${activeIndex}`}
          style={{
            position: 'fixed',
            top: dropUp ? undefined : position.top,
            bottom: dropUp ? window.innerHeight - position.top : undefined,
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight,
            transitionDuration: `${TRANSITION_MS}ms`
          }}
          className={`glass-scrollbar z-[200] overflow-y-auto overscroll-contain scroll-smooth scroll-py-1 rounded-xl border border-white/20 bg-slate-950/60 p-1 shadow-[0_24px_70px_-20px_rgba(2,6,23,0.9)] ring-1 ring-inset ring-white/10 backdrop-blur-2xl backdrop-saturate-150 transition-[opacity,transform] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            dropUp ? 'origin-bottom' : 'origin-top'
          } ${
            entered
              ? 'opacity-100 translate-y-0 scale-100'
              : `pointer-events-none opacity-0 scale-[0.96] ${dropUp ? 'translate-y-2' : '-translate-y-2'}`
          }`}
        >
          {/* Lit top edge, matching the glass card */}
          <span className="pointer-events-none sticky top-0 -mt-1 block h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <div
                key={option.value}
                id={`${listboxId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
                style={{
                  transitionDelay: entered && !settled ? `${Math.min(index, 8) * STAGGER_MS}ms` : '0ms'
                }}
                className={`flex cursor-pointer select-none items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 sm:py-2 text-xs transition-[background-color,color,opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
                  entered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                } ${
                  isSelected
                    ? 'bg-blue-500/30 font-semibold text-white'
                    : isActive
                      ? 'bg-white/12 text-white'
                      : 'text-slate-200'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="size-3.5 shrink-0 text-blue-200" />}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export default GlassSelect;

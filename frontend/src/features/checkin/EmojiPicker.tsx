import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { EMOJI_OPTIONS } from "./emojis";
import type { Emoji } from "./types";

interface Props {
  value: Emoji | null;
  onChange: (emoji: Emoji) => void;
}

/** Six big face buttons (commit C4). Works with touch, mouse, and arrow keys. */
export function EmojiPicker({ value, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + EMOJI_OPTIONS.length) % EMOJI_OPTIONS.length;
    refs.current[next]?.focus();
    onChange(EMOJI_OPTIONS[next].value);
  };

  const selectedIndex = Math.max(0, EMOJI_OPTIONS.findIndex((o) => o.value === value));

  return (
    <div role="radiogroup" aria-label="How do you feel?" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {EMOJI_OPTIONS.map((opt, i) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === selectedIndex ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border-4 bg-white p-3 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${
              selected ? "border-sky-500 bg-sky-50 scale-105" : "border-transparent shadow"
            }`}
          >
            <span aria-hidden="true" className="text-5xl leading-none">
              {opt.glyph}
            </span>
            <span className="mt-2 text-lg font-semibold text-slate-700">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

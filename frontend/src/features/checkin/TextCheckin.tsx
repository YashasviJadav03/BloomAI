interface Props {
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
}

/** Optional "tell me more" box (commit C5). */
export function TextCheckin({ value, onChange, maxLength = 300 }: Props) {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-xl font-semibold text-slate-700">Want to tell me more? (You can skip this.)</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        rows={3}
        maxLength={maxLength}
        placeholder="I feel… because…"
        className="w-full rounded-2xl border-2 border-slate-200 p-4 text-xl focus:border-sky-400 focus:outline-none"
      />
      <span className="self-end text-sm text-slate-400" aria-live="polite">
        {value.length}/{maxLength}
      </span>
    </label>
  );
}

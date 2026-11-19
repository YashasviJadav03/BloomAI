import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartDay } from "./types";

const SERIES = [
  { key: "mood", name: "Mood", color: "var(--viz-series-mood)", dash: undefined },
  { key: "focus", name: "Focus", color: "var(--viz-series-focus)", dash: "6 4" },
] as const;

interface TooltipProps {
  active?: boolean;
  payload?: { payload: ChartDay }[];
}

function DayTooltip({ active, payload }: TooltipProps) {
  const day = payload?.[0]?.payload;
  if (!active || !day) return null;
  return (
    <div className="viz-card rounded-xl border border-slate-200 px-3 py-2 text-sm shadow">
      <div className="font-semibold">{day.label === "Today" ? "Today" : day.date}</div>
      {day.mood === null ? (
        <div className="viz-muted">No check-in</div>
      ) : (
        <>
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-0.5 w-4" style={{ background: s.color }} />
              {s.name}: <strong>{day[s.key]}</strong>
            </div>
          ))}
          <div className="viz-muted">
            {day.checkins} check-in{day.checkins === 1 ? "" : "s"}
          </div>
        </>
      )}
    </div>
  );
}

/** Label the series name at its last point, so identity never relies on colour alone. */
function endLabel(name: string, color: string, lastIndex: number) {
  return (props: { x?: number; y?: number; index?: number }) =>
    props.index === lastIndex && props.x != null && props.y != null ? (
      <text x={props.x + 8} y={props.y + 4} fontSize={13} fill="var(--viz-text-secondary)">
        <tspan fill={color}>● </tspan>
        {name}
      </text>
    ) : (
      <g />
    );
}

/** Mood and focus by day (commit C13). One 0-100 axis for both scores. */
export function MoodChart({ days }: { days: ChartDay[] }) {
  const [showTable, setShowTable] = useState(false);
  const hasData = days.some((d) => d.mood !== null);

  const lastIndex = (key: "mood" | "focus") => {
    for (let i = days.length - 1; i >= 0; i--) if (days[i][key] !== null) return i;
    return -1;
  };

  return (
    <figure className="viz-card flex flex-col gap-3 rounded-3xl p-4 shadow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="text-xl font-bold">My week</figcaption>
        <div className="flex items-center gap-4 text-sm" aria-hidden={showTable}>
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <svg width="20" height="6" aria-hidden="true">
                <line x1="0" y1="3" x2="20" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
              </svg>
              {s.name}
            </span>
          ))}
          <button type="button" className="viz-muted underline" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
            {showTable ? "Show chart" : "Show table"}
          </button>
        </div>
      </div>

      {!hasData ? (
        <p className="viz-muted py-10 text-center text-lg">Your mood chart will grow here after your first check-in.</p>
      ) : showTable ? (
        <table className="w-full text-left text-base">
          <thead>
            <tr className="viz-muted">
              <th className="py-1 font-semibold">Day</th>
              <th className="py-1 font-semibold">Mood</th>
              <th className="py-1 font-semibold">Focus</th>
              <th className="py-1 font-semibold">Check-ins</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <td className="py-1">{d.label}</td>
                <td className="py-1">{d.mood ?? "–"}</td>
                <td className="py-1">{d.focus ?? "–"}</td>
                <td className="py-1">{d.checkins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="w-full" style={{ height: 256 }} role="img" aria-label="Line chart of mood and focus scores for the last 7 days. Use Show table for the numbers.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={days} margin={{ top: 12, right: 64, bottom: 4, left: -16 }}>
              <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
              <XAxis dataKey="label" interval={0} tickLine={false} axisLine={false} tick={{ fill: "var(--viz-text-secondary)", fontSize: 12 }} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--viz-text-secondary)", fontSize: 13 }} />
              <Tooltip content={<DayTooltip />} cursor={{ stroke: "var(--viz-grid)", strokeWidth: 2 }} />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dash}
                  dot={{ r: 4, strokeWidth: 2, stroke: "var(--viz-surface)", fill: s.color }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--viz-surface)" }}
                  connectNulls={false}
                  isAnimationActive={false}
                  label={endLabel(s.name, s.color, lastIndex(s.key))}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}

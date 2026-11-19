import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CheckInFlow, fetchPraise } from "../src/features/checkin";
import { ProgressPage } from "../src/features/progress";
import "./index.css";

/** Dev-only shell: Member B's real app replaces this (routing, safe-mode and calm-down screens). */
function Preview() {
  const [tab, setTab] = useState<"checkin" | "progress">("checkin");
  const [note, setNote] = useState("");
  const [key, setKey] = useState(0);

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      type="button"
      onClick={() => { setTab(id); setNote(""); setKey((k) => k + 1); }}
      className={`rounded-full px-5 py-2 text-lg font-semibold ${tab === id ? "bg-sky-500 text-white" : "bg-white text-slate-700"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <nav className="flex flex-wrap items-center gap-3">
        {tabBtn("checkin", "Check-in")}
        {tabBtn("progress", "My progress")}
        <button
          type="button"
          className="rounded-full bg-white px-5 py-2 text-lg text-slate-700"
          onClick={async () => setNote(`Praise: ${(await fetchPraise({ event: "step_completed", child_name: "Aarav", task_title: "Homework", step_text: "Write the date", streak: 3 })).message}`)}
        >
          Try praise
        </button>
      </nav>

      {note && <div role="status" className="rounded-2xl bg-amber-50 p-4 text-lg text-amber-900">{note}</div>}

      {tab === "checkin" ? (
        <CheckInFlow
          key={key}
          childName="Aarav"
          onSafeMode={() => setNote("➡ Safe mode: the app would open Member B's safe-mode screen now (no calm reply requested).")}
          onActivity={(a) => setNote(`➡ Activity "${a}": the app would open Member B's calm-down screen now.`)}
          onDone={() => { setNote("➡ Done: back to the task."); setKey((k) => k + 1); }}
        />
      ) : (
        <ProgressPage key={key} childName="Aarav" />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);

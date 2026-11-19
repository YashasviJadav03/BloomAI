// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckInFlow } from "./CheckInFlow";
import { nextStepAfterCheckin } from "./decide";

type Handler = (body: unknown) => { status?: number; json: unknown };

function mockApi(routes: Record<string, Handler>) {
  const calls: { path: string; body: unknown }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ path, body });
    const handler = routes[path];
    if (!handler) return new Response(JSON.stringify({ detail: "not found" }), { status: 404 });
    const { status = 200, json } = handler(body);
    return new Response(JSON.stringify(json), { status, headers: { "Content-Type": "application/json" } });
  }));
  return calls;
}

const saved = (safe_mode: boolean) => ({ id: 1, focus_score: 42, emotion_score: 35, label: safe_mode ? "distressed" : "frustrated", safe_mode });

describe("nextStepAfterCheckin", () => {
  it("routes on safe_mode only", () => {
    expect(nextStepAfterCheckin({ safe_mode: true })).toBe("safe_mode");
    expect(nextStepAfterCheckin({ safe_mode: false })).toBe("calm_reply");
  });
});

describe("CheckInFlow", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(cleanup);

  it("goes to safe mode and never asks for a calm reply when flagged", async () => {
    const calls = mockApi({ "/api/checkins": () => ({ status: 201, json: saved(true) }) });
    const onSafeMode = vi.fn();
    render(<CheckInFlow childName="Aarav" sessionId={5} onSafeMode={onSafeMode} onDone={vi.fn()} enableVoice={false} />);

    fireEvent.click(screen.getByRole("radio", { name: /sad/i }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "I hate myself" } });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => expect(onSafeMode).toHaveBeenCalledWith(expect.objectContaining({ safe_mode: true })));
    expect(calls.map((c) => c.path)).toEqual(["/api/checkins"]);
    expect(calls[0].body).toEqual({ session_id: 5, emoji: "sad", text: "I hate myself", audio_features: null });
  });

  it("shows the calm reply and its activity when not flagged", async () => {
    const calls = mockApi({
      "/api/checkins": () => ({ status: 201, json: saved(false) }),
      "/api/calm-reply": () => ({ json: { message: "That sounds frustrating. Let's take a short break.", suggested_activity: "breathing", source: "llm" } }),
    });
    const onActivity = vi.fn();
    const onSafeMode = vi.fn();
    render(<CheckInFlow childName="Aarav" onSafeMode={onSafeMode} onActivity={onActivity} onDone={vi.fn()} enableVoice={false} />);

    fireEvent.click(screen.getByRole("radio", { name: /angry/i }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(await screen.findByTestId("calm-reply-message")).toHaveProperty("textContent", "That sounds frustrating. Let's take a short break.");
    expect(onSafeMode).not.toHaveBeenCalled();
    expect(calls[1]).toEqual({
      path: "/api/calm-reply",
      body: { child_name: "Aarav", emoji: "angry", text: null, focus_score: 42, emotion_score: 35 },
    });
    fireEvent.click(screen.getByRole("button", { name: "Breathe with me" }));
    expect(onActivity).toHaveBeenCalledWith("breathing", expect.objectContaining({ id: 1 }));
  });

  it("falls back to a built-in reply when the calm-reply call fails", async () => {
    mockApi({
      "/api/checkins": () => ({ status: 201, json: saved(false) }),
      "/api/calm-reply": () => ({ status: 500, json: { detail: "boom" } }),
    });
    render(<CheckInFlow onSafeMode={vi.fn()} onDone={vi.fn()} enableVoice={false} />);
    fireEvent.click(screen.getByRole("radio", { name: /tired/i }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect((await screen.findByTestId("calm-reply-message")).textContent).toMatch(/stretch/i);
  });

  it("asks to try again (and never guesses safe_mode) when saving fails", async () => {
    mockApi({ "/api/checkins": () => ({ status: 500, json: { detail: "db down" } }) });
    const onSafeMode = vi.fn();
    render(<CheckInFlow onSafeMode={onSafeMode} onDone={vi.fn()} enableVoice={false} />);
    fireEvent.click(screen.getByRole("radio", { name: /worried/i }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/grown-up/);
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(onSafeMode).not.toHaveBeenCalled();
  });

  it("supports arrow keys in the emoji picker", () => {
    render(<CheckInFlow onSafeMode={vi.fn()} onDone={vi.fn()} enableVoice={false} />);
    const happy = screen.getByRole("radio", { name: /happy/i });
    fireEvent.keyDown(happy, { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: /calm/i }).getAttribute("aria-checked")).toBe("true");
  });
});

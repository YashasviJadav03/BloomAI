import { describe, expect, it } from "vitest";
import { countWords, wordsPerMinute } from "./pace";
import { rms, rmsToLevel, VOICE_GATE, VolumeTracker } from "./volume";

describe("volume extraction", () => {
  it("computes RMS of a constant and a sine wave", () => {
    expect(rms([0.5, -0.5, 0.5, -0.5])).toBeCloseTo(0.5);
    const sine = Array.from({ length: 1000 }, (_, i) => Math.sin((2 * Math.PI * i) / 100));
    expect(rms(sine)).toBeCloseTo(1 / Math.SQRT2, 2);
    expect(rms([])).toBe(0);
  });

  it("maps dBFS onto 0..1", () => {
    expect(rmsToLevel(0)).toBe(0);
    expect(rmsToLevel(1)).toBe(1);
    expect(rmsToLevel(0.001)).toBeCloseTo(0); // -60 dBFS
    expect(rmsToLevel(0.0316)).toBeCloseTo(0.5, 1); // about -30 dBFS: normal speech
    expect(rmsToLevel(5)).toBe(1);
  });

  it("averages voiced frames only and uses a robust peak", () => {
    const t = new VolumeTracker();
    t.add(0.1, 0); // silence: ignored
    for (let i = 0; i < 99; i++) t.add(0.5, 1 + i * 0.05);
    t.add(1, 6); // one bump must not become the peak
    const s = t.summary();
    expect(s.avg_volume).toBeCloseTo(0.51, 2);
    expect(s.peak_volume).toBe(0.5);
    expect(t.speakingSeconds).toBeCloseTo(5);
    expect(t.voicedFrames).toBe(100);
  });

  it("returns zeros when nothing was said", () => {
    const t = new VolumeTracker();
    t.add(VOICE_GATE - 0.01, 1);
    expect(t.summary()).toEqual({ avg_volume: 0, peak_volume: 0 });
  });
});

describe("pace extraction", () => {
  it("counts words, including contractions", () => {
    expect(countWords("I can't do this homework")).toBe(5);
    expect(countWords("   ")).toBe(0);
  });

  it("computes words per minute and falls back to null", () => {
    expect(wordsPerMinute(20, 10)).toBe(120);
    expect(wordsPerMinute(1, 10)).toBeNull(); // too few words
    expect(wordsPerMinute(10, 0.5)).toBeNull(); // too short
    expect(wordsPerMinute(1000, 1)).toBe(400); // capped
  });
});

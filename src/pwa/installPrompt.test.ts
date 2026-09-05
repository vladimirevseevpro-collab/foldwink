import { describe, expect, it } from "vitest";
import { isBeforeInstallPromptEvent } from "./installPrompt";

describe("install prompt detection", () => {
  it("recognizes a browser install event without relying on a browser-specific global type", () => {
    const event = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
    };
    event.prompt = async () => undefined;
    event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
    expect(isBeforeInstallPromptEvent(event)).toBe(true);
  });

  it("rejects ordinary events", () => {
    expect(isBeforeInstallPromptEvent(new Event("click"))).toBe(false);
  });
});
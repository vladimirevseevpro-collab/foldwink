import { describe, expect, it } from "vitest";
import { resolveMonetizationConfig, supporterCheckoutUrl, tipJarUrl } from "../config";

describe("resolveMonetizationConfig", () => {
  it("hides CTAs by default", () => {
    const config = resolveMonetizationConfig({}, {});
    expect(config.koFiHandle).toBe("");
    expect(config.supporterCheckoutUrl).toBe("");
    expect(tipJarUrl(config)).toBeNull();
    expect(supporterCheckoutUrl(config)).toBeNull();
  });

  it("accepts valid public env and runtime override values", () => {
    const config = resolveMonetizationConfig(
      {
        VITE_KOFI_HANDLE: "envhandle",
        VITE_SUPPORTER_CHECKOUT_URL: "https://checkout.example/env",
      },
      {
        koFiHandle: "foldwink",
        supporterCheckoutUrl: "https://checkout.example/runtime",
      },
    );
    expect(config.koFiHandle).toBe("foldwink");
    expect(config.supporterCheckoutUrl).toBe("https://checkout.example/runtime");
    expect(tipJarUrl(config)).toBe("https://ko-fi.com/foldwink");
  });

  it("rejects invalid handles and non-https checkout urls", () => {
    const config = resolveMonetizationConfig(
      {
        VITE_KOFI_HANDLE: "bad handle",
        VITE_SUPPORTER_CHECKOUT_URL: "http://checkout.example/insecure",
      },
      {},
    );
    expect(config.koFiHandle).toBe("");
    expect(config.supporterCheckoutUrl).toBe("");
  });
});

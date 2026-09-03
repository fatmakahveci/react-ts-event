import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  checkAuthLoader,
  getAuthToken,
  getTokenDuration,
  tokenLoader,
} from "./auth";

describe("authentication route utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  test("returns null when no token is stored", () => {
    expect(getAuthToken()).toBeNull();
    expect(tokenLoader()).toBeNull();
    expect(getTokenDuration()).toBe(0);
  });

  test("returns an active token and its remaining duration", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T10:00:00.000Z"));
    localStorage.setItem("token", "active-token");
    localStorage.setItem("expiration", "2030-01-01T11:00:00.000Z");

    expect(getAuthToken()).toBe("active-token");
    expect(getTokenDuration()).toBe(3_600_000);
  });

  test("marks expired tokens and redirects unauthenticated users", () => {
    localStorage.setItem("token", "expired-token");
    localStorage.setItem("expiration", "2000-01-01T00:00:00.000Z");
    expect(getAuthToken()).toBe("EXPIRED");

    localStorage.clear();
    const response = checkAuthLoader() as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/auth");
  });

  test("allows authenticated users to continue", () => {
    localStorage.setItem("token", "active-token");
    localStorage.setItem("expiration", "2999-01-01T00:00:00.000Z");
    expect(checkAuthLoader()).toBeNull();
  });
});

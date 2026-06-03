import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ThemeProvider, useTheme } from "./theme-provider";

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        go dark
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        go light
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("applies the dark class and persists when set to dark", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <Probe />
      </ThemeProvider>
    );
    await user.click(screen.getByRole("button", { name: "go dark" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("panel-io-theme")).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("removes the dark class when set to light", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="dark">
        <Probe />
      </ThemeProvider>
    );
    await user.click(screen.getByRole("button", { name: "go light" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("panel-io-theme")).toBe("light");
  });

  it("reads the persisted theme on mount", () => {
    localStorage.setItem("panel-io-theme", "dark");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("tracks the OS preference while in system mode", () => {
    const handlers: Array<() => void> = [];
    const mql = {
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: (_event: string, handler: () => void) => {
        handlers.push(handler);
      },
      removeEventListener: vi.fn(),
    };
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue(mql) as typeof window.matchMedia;

    render(
      <ThemeProvider defaultTheme="system">
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("resolved").textContent).toBe("light");

    mql.matches = true;
    for (const handler of handlers) handler();
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    window.matchMedia = original;
  });

  it("has no a11y violations in its rendered subtree", async () => {
    const { container } = render(
      <ThemeProvider defaultTheme="light">
        <Probe />
      </ThemeProvider>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

afterEach(() => {
  document.documentElement.classList.remove("dark");
});

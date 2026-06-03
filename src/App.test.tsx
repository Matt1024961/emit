import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "@/components/theme/theme-provider";
import App from "./App";

describe("App", () => {
  it("renders the wizard shell", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <App />
      </ThemeProvider>
    );
    expect(screen.getByText("Panel I/O Configurator")).toBeInTheDocument();
  });
});

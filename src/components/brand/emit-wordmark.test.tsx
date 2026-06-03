import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { EmitWordmark } from "./emit-wordmark";

describe("EmitWordmark", () => {
  it("renders the EMIT logo", () => {
    render(<EmitWordmark />);
    expect(screen.getByRole("img", { name: "EMIT" })).toBeInTheDocument();
  });

  it("renders the subtitle lockup when asked", () => {
    render(<EmitWordmark withSubtitle />);
    expect(screen.getByText("Panel I/O Configurator")).toBeInTheDocument();
  });

  it("applies subtitleClassName to the subtitle line", () => {
    render(<EmitWordmark withSubtitle subtitleClassName="hidden sm:block" />);
    expect(screen.getByText("Panel I/O Configurator")).toHaveClass("hidden", "sm:block");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<EmitWordmark withSubtitle size="lg" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

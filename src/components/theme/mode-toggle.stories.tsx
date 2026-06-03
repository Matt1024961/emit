import type { Meta, StoryObj } from "@storybook/react-vite";
import { ModeToggle } from "./mode-toggle";
import { ThemeProvider } from "./theme-provider";

const meta = {
  title: "Theme/ModeToggle",
  component: ModeToggle,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

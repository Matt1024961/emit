import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { placeholder: "Any notes…", "aria-label": "Notes", rows: 3 },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Invalid: Story = { args: { "aria-invalid": true } };
export const Mobile320: Story = { parameters: { viewport: { defaultViewport: "mobile320" } } };
export const Tablet768: Story = { parameters: { viewport: { defaultViewport: "tablet768" } } };

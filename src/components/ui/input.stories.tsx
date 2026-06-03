import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "Type here…", "aria-label": "Example" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Invalid: Story = { args: { "aria-invalid": true } };
export const Disabled: Story = { args: { disabled: true } };
export const Mobile320: Story = { parameters: { viewport: { defaultViewport: "mobile320" } } };
export const Tablet768: Story = { parameters: { viewport: { defaultViewport: "tablet768" } } };

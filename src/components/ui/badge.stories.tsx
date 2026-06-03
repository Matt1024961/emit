import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Badge" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "primary",
        "success",
        "warning",
        "info",
        "muted",
      ],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Primary: Story = { args: { variant: "primary", children: "4-20mA" } };
export const Success: Story = { args: { variant: "success", children: "Mapped" } };
export const Warning: Story = { args: { variant: "warning", children: "Capacity" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Form-C" } };
export const Info: Story = { args: { variant: "info", children: "Pulse" } };
export const Mobile320: Story = { parameters: { viewport: { defaultViewport: "mobile320" } } };
export const Tablet768: Story = { parameters: { viewport: { defaultViewport: "tablet768" } } };

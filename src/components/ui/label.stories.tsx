import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="demo">Configuration name</Label>
      <Input id="demo" placeholder="e.g. Kodiak Site 14" />
    </div>
  ),
};
export const Mobile320: Story = {
  ...Default,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
export const Tablet768: Story = {
  ...Default,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

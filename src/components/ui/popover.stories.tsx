import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-popover-foreground">
          This is a sample popover. Place content here.
        </p>
      </PopoverContent>
    </Popover>
  );
}

const meta = {
  title: "UI/Popover",
  component: PopoverDemo,
  tags: ["autodocs"],
} satisfies Meta<typeof PopoverDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile320: Story = { parameters: { viewport: { defaultViewport: "mobile320" } } };
export const Tablet768: Story = { parameters: { viewport: { defaultViewport: "tablet768" } } };

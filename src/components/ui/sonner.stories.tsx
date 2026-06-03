import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { Toaster, toast } from "./sonner";

function ToasterDemo() {
  return (
    <>
      <Toaster />
      <Button onClick={() => toast("Saved")}>Show Toast</Button>
    </>
  );
}

const meta = {
  title: "UI/Sonner",
  component: ToasterDemo,
  tags: ["autodocs"],
} satisfies Meta<typeof ToasterDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile320: Story = { parameters: { viewport: { defaultViewport: "mobile320" } } };
export const Tablet768: Story = { parameters: { viewport: { defaultViewport: "tablet768" } } };

import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>
          <FileText className="text-muted-foreground size-4" />
          Configuration
        </CardTitle>
        <CardDescription>Give this panel configuration a unique name.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">Card body content goes here.</p>
      </CardContent>
    </Card>
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

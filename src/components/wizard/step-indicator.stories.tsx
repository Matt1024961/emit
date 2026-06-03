import type { Meta, StoryObj } from "@storybook/react-vite";
import { StepIndicator } from "./step-indicator";

const meta = {
  title: "Wizard/StepIndicator",
  component: StepIndicator,
  tags: ["autodocs"],
  argTypes: { currentStep: { control: "select", options: [1, 2, 3] } },
} satisfies Meta<typeof StepIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Step1: Story = { args: { currentStep: 1 } };
export const Step2: Story = { args: { currentStep: 2 } };
export const Step3: Story = { args: { currentStep: 3 } };
export const Mobile320: Story = {
  args: { currentStep: 2 },
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
export const Tablet768: Story = {
  args: { currentStep: 2 },
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grouped: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select a compressor model…" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>JG/JGC Series</SelectLabel>
          <SelectItem value="JG/2">JG/2</SelectItem>
          <SelectItem value="JG/4">JG/4</SelectItem>
          <SelectItem value="JGC/4">JGC/4</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>KB/KBB Series</SelectLabel>
          <SelectItem value="KBK">KBK</SelectItem>
          <SelectItem value="KBZ">KBZ</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

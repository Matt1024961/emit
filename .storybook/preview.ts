import type { Preview } from "@storybook/react-vite";
import "../src/index.css";

/**
 * Pre-registered viewports mirror the Rufus convention: every atom/molecule
 * story ships Mobile320 and Tablet768 variants for responsive coverage.
 */
const preview: Preview = {
  parameters: {
    layout: "centered",
    viewport: {
      options: {
        mobile320: { name: "Mobile 320", styles: { width: "320px", height: "568px" } },
        tablet768: { name: "Tablet 768", styles: { width: "768px", height: "1024px" } },
        desktop1280: { name: "Desktop 1280", styles: { width: "1280px", height: "800px" } },
      },
    },
  },
};

export default preview;

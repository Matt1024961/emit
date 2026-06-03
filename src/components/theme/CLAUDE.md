# components/theme — theming

Light / dark / system theming, the shadcn Vite dark-mode pattern.

- `theme-provider.tsx` — `ThemeProvider` + `useTheme()`. Persists the choice to `localStorage` under **`panel-io-theme`**, toggles the `.dark` class on `<html>`, and tracks the OS preference while in `system` mode.
- `mode-toggle.tsx` — the header sun/moon dropdown (Light / Dark / System).

## Rules

- **The theme is applied by the `.dark` class on `<html>`.** Everything theme-aware must use the semantic tokens in `src/index.css` (`bg-background`, `text-foreground`, …) so both modes resolve automatically. Never branch on the theme value to pick a colour.
- **No-flash:** the initial theme is set by an inline script in `index.html` before React mounts. If you change the storage key or class strategy, update that script too.
- `useTheme()` must be called inside a `ThemeProvider` (mounted at the app root in `main.tsx`). In tests, wrap the component in `<ThemeProvider>`.
- Keep `light` / `dark` / `system` as the only options; `resolvedTheme` is the applied value once `system` is resolved.

/**
 * Without this file, Next.js has no PostCSS pipeline configured at all — it ships
 * app/globals.css through untouched, `@tailwind base/components/utilities` and
 * `@apply` included verbatim as literal (meaningless) CSS text, and the page renders
 * completely unstyled. tailwindcss and autoprefixer were dependencies from the start;
 * nothing was ever wired up to actually invoke them as PostCSS plugins.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

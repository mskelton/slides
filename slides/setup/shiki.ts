import { defineShikiSetup } from "@slidev/types"
import { fileURLToPath } from "node:url"

export default defineShikiSetup(async ({ loadTheme }) => {
  return {
    theme: {
      dark: await loadTheme(
        fileURLToPath(new URL("./tokyonight.json", import.meta.url)),
      ),
      light: await loadTheme(
        fileURLToPath(new URL("./tokyolight.json", import.meta.url)),
      ),
    },
  }
})

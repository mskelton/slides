import { defineShikiSetup } from "@slidev/types"
import fs from "node:fs/promises"

async function read(filename: string) {
  return JSON.parse(
    await fs.readFile(new URL(filename, import.meta.url), "utf-8"),
  )
}

export default defineShikiSetup(async () => {
  return {
    themes: {
      dark: await read("./tokyonight.json"),
      light: await read("./tokyolight.json"),
    },
  }
})

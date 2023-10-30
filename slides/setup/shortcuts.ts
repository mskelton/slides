import type { NavOperations, ShortcutOptions } from "@slidev/types"
import { defineShortcutsSetup } from "@slidev/types"

export default defineShortcutsSetup(
  (_: NavOperations, base: ShortcutOptions[]) => {
    return [...base.filter((shortcut) => shortcut.name !== "toggle_dark")]
  },
)

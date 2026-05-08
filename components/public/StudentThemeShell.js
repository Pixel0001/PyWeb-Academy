export const dynamic = 'force-dynamic'

import NoCopyPaste from './NoCopyPaste'
import EquippedShowcase from './EquippedShowcase'
import ThemeApplicator from './ThemeApplicator'
import CosmeticEffects from './CosmeticEffects'
import { getStudentByToken, getThemeById } from '@/lib/student-cache'

export default async function StudentThemeShell({ token, children }) {
  let theme = null
  let equippedList = []

  try {
    // getStudentByToken e deduplicat prin React cache() —
    // dacă page.js l-a apelat deja în același render, NU se mai face un query nou
    const student = await getStudentByToken(token)

    if (student) {
      if (student.activeThemeId) {
        theme = await getThemeById(student.activeThemeId)
      }
      equippedList = (student.equipped || []).map(e => ({
        type: e.type,
        name: e.cosmetic?.name || '',
        rarity: e.cosmetic?.rarity || 'COMMON',
      }))
    }
  } catch (e) {
    console.error('[StudentThemeShell]', e)
  }

  const themeData = theme ? {
    name: theme.name,
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
    glowColor: theme.glowColor,
    bgGradient: theme.bgGradient,
  } : null

  return (
    <>
      <ThemeApplicator initialTheme={themeData} />
      <CosmeticEffects items={equippedList} />
      <NoCopyPaste />
      <EquippedShowcase items={equippedList} themeName={theme?.name} />
      {children}
    </>
  )
}

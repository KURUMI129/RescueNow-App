const fs = require('fs');

const filesToReplace = [
  'app/(tabs)/options.tsx',
  'app/(tabs)/services.tsx',
  'app/(tabs)/technician-detail.tsx',
  'app/(tabs)/technicians.tsx',
  'app/(tabs)/tracking.tsx',
  'app/_layout.tsx',
  'app/(tabs)/index.tsx',
  'app/(auth)/login.tsx',
  'app/(auth)/register.tsx',
  'app/(auth)/forgot-password.tsx',
  'components/auth/auth-header.tsx'
];

for (const file of filesToReplace) {
  if (!fs.existsSync(file)) continue;

  let content = fs.readFileSync(file, 'utf8');

  // Add the import if not exists
  if (!content.includes('use-active-theme')) {
    content = 'import { useActiveTheme } from "@/hooks/use-active-theme";\n' + content;
  }

  // Replace useColorScheme blocks
  content = content.replace(/const\s+colorScheme\s*=\s*useColorScheme\(\);[\s\S]*?const\s+colors\s*=\s*(?:colorScheme\s*===\s*["']dark["']\s*\?\s*HOME_THEME_COLORS\.dark\s*:\s*HOME_THEME_COLORS\.light);/g, 'const activeTheme = useActiveTheme();\n  const colors = HOME_THEME_COLORS[activeTheme];');

  // Replace static dark themes
  content = content.replace(/const\s+colors\s*=\s*AUTH_THEME_COLORS\.dark;/g, 'const activeTheme = useActiveTheme();\n  const colors = AUTH_THEME_COLORS[activeTheme];');
  content = content.replace(/const\s+colors\s*=\s*HOME_THEME_COLORS\.dark;/g, 'const activeTheme = useActiveTheme();\n  const colors = HOME_THEME_COLORS[activeTheme];');

  // Fix property error
  content = content.replace(/colors\.primaryDisabled/g, "colors.cardBorder");

  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
}

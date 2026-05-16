// Lightweight input validators shared across auth screens.

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export type PasswordRule = {
  key: "length" | "upper" | "digit";
  ok: boolean;
};

export function checkPasswordRules(password: string): PasswordRule[] {
  return [
    { key: "length", ok: password.length >= 8 },
    { key: "upper", ok: /[A-Z]/.test(password) },
    { key: "digit", ok: /[0-9]/.test(password) },
  ];
}

export function isStrongPassword(password: string): boolean {
  return checkPasswordRules(password).every((r) => r.ok);
}

export function passwordRuleLabel(
  key: PasswordRule["key"],
  language: "es" | "en",
): string {
  if (language === "en") {
    return {
      length: "At least 8 characters",
      upper: "At least 1 uppercase letter",
      digit: "At least 1 number",
    }[key];
  }
  return {
    length: "Al menos 8 caracteres",
    upper: "Al menos 1 mayúscula",
    digit: "Al menos 1 número",
  }[key];
}

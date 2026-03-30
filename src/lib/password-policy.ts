export const PASSWORD_MIN_LENGTH = 8;

export function validatePasswordPolicy(password: string) {
  const trimmed = password.trim();

  if (trimmed.length < PASSWORD_MIN_LENGTH) {
    throw new Error("PASSWORD_POLICY");
  }

  if (!/[a-z]/.test(trimmed) || !/[A-Z]/.test(trimmed) || !/[0-9]/.test(trimmed)) {
    throw new Error("PASSWORD_POLICY");
  }

  return trimmed;
}

export function getPasswordPolicyHint() {
  return "Use at least 8 characters with uppercase, lowercase, and a number.";
}

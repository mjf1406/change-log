export const ALLOWED_EMAIL = "michael.fitzgerald.1406@gmail.com";

export function isAllowedEmail(email: string | undefined | null): boolean {
  return email === ALLOWED_EMAIL;
}

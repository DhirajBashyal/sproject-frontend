// The API has no roles or permissions yet. Every signed-in user can do everything.
export function can(_permission: string) {
  return true;
}

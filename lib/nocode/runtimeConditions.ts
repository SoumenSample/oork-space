export async function evaluateCondition(
  conditionKey: string,
  input: Record<string, unknown>
): Promise<boolean> {
  if (conditionKey === "always") return true;

  if (conditionKey === "hasEmail" || conditionKey === "email") {
    const email = input?.email ?? input?.Email;
    return typeof email === "string" && email.includes("@");
  }

  return false;
}
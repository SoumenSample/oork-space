export async function evaluateCondition(
  conditionKey: string,
  input: Record<string, unknown>
): Promise<boolean> {
  if (conditionKey === "always") return true;

  if (conditionKey === "hasEmail") {
    const email = input?.email;
    return typeof email === "string" && email.includes("@");
  }

  return false;
}
type Primitive = string | number | boolean | null | undefined;
export type FormulaContext = Record<string, Primitive>;

type TokenType =
  | "number"
  | "string"
  | "identifier"
  | "operator"
  | "punct"
  | "eof";

type Token = {
  type: TokenType;
  value: string;
};

type AstNode =
  | { type: "literal"; value: Primitive }
  | { type: "identifier"; name: string }
  | { type: "unary"; op: string; right: AstNode }
  | { type: "binary"; op: string; left: AstNode; right: AstNode }
  | { type: "call"; name: string; args: AstNode[] };

class FormulaError extends Error {}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const isDigit = (c: string) => c >= "0" && c <= "9";
  const isAlpha = (c: string) => /[A-Za-z_]/.test(c);
  const isAlphaNum = (c: string) => /[A-Za-z0-9_]/.test(c);

  while (i < input.length) {
    const c = input[i];

    if (/\s/.test(c)) {
      i += 1;
      continue;
    }

    if (c === '"') {
      let j = i + 1;
      let out = "";
      while (j < input.length && input[j] !== '"') {
        if (input[j] === "\\" && j + 1 < input.length) {
          out += input[j + 1];
          j += 2;
          continue;
        }
        out += input[j];
        j += 1;
      }
      if (j >= input.length) throw new FormulaError("Unterminated string");
      tokens.push({ type: "string", value: out });
      i = j + 1;
      continue;
    }

    if (isDigit(c) || (c === "." && i + 1 < input.length && isDigit(input[i + 1]))) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j += 1;
      tokens.push({ type: "number", value: input.slice(i, j) });
      i = j;
      continue;
    }

    if (isAlpha(c)) {
      let j = i;
      while (j < input.length && isAlphaNum(input[j])) j += 1;
      tokens.push({ type: "identifier", value: input.slice(i, j) });
      i = j;
      continue;
    }

    const two = input.slice(i, i + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(two)) {
      tokens.push({ type: "operator", value: two });
      i += 2;
      continue;
    }

    if ([">", "<", "+", "-", "*", "/", "!"].includes(c)) {
      tokens.push({ type: "operator", value: c });
      i += 1;
      continue;
    }

    if (["(", ")", ","].includes(c)) {
      tokens.push({ type: "punct", value: c });
      i += 1;
      continue;
    }

    throw new FormulaError(`Unexpected character: ${c}`);
  }

  tokens.push({ type: "eof", value: "" });
  return tokens;
}

class Parser {
  private idx = 0;

  constructor(private readonly tokens: Token[]) {}

  private current() {
    return this.tokens[this.idx];
  }

  private eat(type: TokenType, value?: string): Token {
    const t = this.current();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new FormulaError(
        `Expected ${value ?? type} but got ${t.value || t.type}`
      );
    }
    this.idx += 1;
    return t;
  }

  parse(): AstNode {
    const expr = this.parseOr();
    this.eat("eof");
    return expr;
  }

  private parseOr(): AstNode {
    let node = this.parseAnd();
    while (this.current().type === "operator" && this.current().value === "||") {
      const op = this.eat("operator").value;
      const right = this.parseAnd();
      node = { type: "binary", op, left: node, right };
    }
    return node;
  }

  private parseAnd(): AstNode {
    let node = this.parseEquality();
    while (this.current().type === "operator" && this.current().value === "&&") {
      const op = this.eat("operator").value;
      const right = this.parseEquality();
      node = { type: "binary", op, left: node, right };
    }
    return node;
  }

  private parseEquality(): AstNode {
    let node = this.parseComparison();
    while (
      this.current().type === "operator" &&
      ["==", "!="].includes(this.current().value)
    ) {
      const op = this.eat("operator").value;
      const right = this.parseComparison();
      node = { type: "binary", op, left: node, right };
    }
    return node;
  }

  private parseComparison(): AstNode {
    let node = this.parseTerm();
    while (
      this.current().type === "operator" &&
      [">", "<", ">=", "<="].includes(this.current().value)
    ) {
      const op = this.eat("operator").value;
      const right = this.parseTerm();
      node = { type: "binary", op, left: node, right };
    }
    return node;
  }

  private parseTerm(): AstNode {
    let node = this.parseFactor();
    while (
      this.current().type === "operator" &&
      ["+", "-"].includes(this.current().value)
    ) {
      const op = this.eat("operator").value;
      const right = this.parseFactor();
      node = { type: "binary", op, left: node, right };
    }
    return node;
  }

  private parseFactor(): AstNode {
    let node = this.parseUnary();
    while (
      this.current().type === "operator" &&
      ["*", "/"].includes(this.current().value)
    ) {
      const op = this.eat("operator").value;
      const right = this.parseUnary();
      node = { type: "binary", op, left: node, right };
    }
    return node;
  }

  private parseUnary(): AstNode {
    if (this.current().type === "operator" && ["!", "-"].includes(this.current().value)) {
      const op = this.eat("operator").value;
      const right = this.parseUnary();
      return { type: "unary", op, right };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): AstNode {
    const t = this.current();

    if (t.type === "number") {
      this.eat("number");
      return { type: "literal", value: Number(t.value) };
    }

    if (t.type === "string") {
      this.eat("string");
      return { type: "literal", value: t.value };
    }

    if (t.type === "identifier") {
      const name = this.eat("identifier").value;
      const upper = name.toUpperCase();
      if (upper === "TRUE") return { type: "literal", value: true };
      if (upper === "FALSE") return { type: "literal", value: false };

      if (this.current().type === "punct" && this.current().value === "(") {
        this.eat("punct", "(");
        const args: AstNode[] = [];
        if (!(this.current().type === "punct" && this.current().value === ")")) {
          do {
            args.push(this.parseOr());
            if (this.current().type === "punct" && this.current().value === ",") {
              this.eat("punct", ",");
            } else {
              break;
            }
          } while (true);
        }
        this.eat("punct", ")");
        return { type: "call", name: upper, args };
      }

      return { type: "identifier", name };
    }

    if (t.type === "punct" && t.value === "(") {
      this.eat("punct", "(");
      const expr = this.parseOr();
      this.eat("punct", ")");
      return expr;
    }

    throw new FormulaError(`Unexpected token: ${t.value || t.type}`);
  }
}

function toNumber(value: Primitive): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBool(value: Primitive): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}

function eq(left: Primitive, right: Primitive): boolean {
  if (typeof left === "number" || typeof right === "number") {
    return toNumber(left) === toNumber(right);
  }
  return String(left ?? "") === String(right ?? "");
}

function parseDateLike(v: Primitive): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function callFunction(name: string, args: Primitive[]): Primitive {
  if (name === "IF") {
    const [cond, whenTrue, whenFalse] = args;
    return toBool(cond) ? whenTrue ?? "" : whenFalse ?? "";
  }

  if (name === "DAYS") {
    const [endRaw, startRaw] = args;
    const end = parseDateLike(endRaw);
    const start = parseDateLike(startRaw);
    if (!end || !start) return 0;

    const ms = end.getTime() - start.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  throw new FormulaError(`Unsupported function: ${name}`);
}

function evaluateNode(node: AstNode, ctx: FormulaContext): Primitive {
  switch (node.type) {
    case "literal":
      return node.value;
    case "identifier": {
      if (Object.prototype.hasOwnProperty.call(ctx, node.name)) {
        return ctx[node.name];
      }
      const lower = node.name.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(ctx, lower)) {
        return ctx[lower];
      }
      return "";
    }
    case "unary": {
      const right = evaluateNode(node.right, ctx);
      if (node.op === "!") return !toBool(right);
      if (node.op === "-") return -toNumber(right);
      throw new FormulaError(`Unsupported unary operator: ${node.op}`);
    }
    case "binary": {
      const left = evaluateNode(node.left, ctx);
      const right = evaluateNode(node.right, ctx);

      switch (node.op) {
        case "||":
          return toBool(left) || toBool(right);
        case "&&":
          return toBool(left) && toBool(right);
        case "==":
          return eq(left, right);
        case "!=":
          return !eq(left, right);
        case ">":
          return toNumber(left) > toNumber(right);
        case "<":
          return toNumber(left) < toNumber(right);
        case ">=":
          return toNumber(left) >= toNumber(right);
        case "<=":
          return toNumber(left) <= toNumber(right);
        case "+":
          if (typeof left === "string" || typeof right === "string") {
            return `${left ?? ""}${right ?? ""}`;
          }
          return toNumber(left) + toNumber(right);
        case "-":
          return toNumber(left) - toNumber(right);
        case "*":
          return toNumber(left) * toNumber(right);
        case "/": {
          const div = toNumber(right);
          if (div === 0) return 0;
          return toNumber(left) / div;
        }
        default:
          throw new FormulaError(`Unsupported operator: ${node.op}`);
      }
    }
    case "call": {
      const args = node.args.map((arg) => evaluateNode(arg, ctx));
      return callFunction(node.name, args);
    }
    default:
      return "";
  }
}

export function evaluateFormula(formula: string, context: FormulaContext): Primitive {
  const input = String(formula || "")
    .trim()
    .replace(/^=/, "")
    .trim();
  if (!input) return "";

  try {
    const tokens = tokenize(input);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    return evaluateNode(ast, context);
  } catch {
    return "#ERROR";
  }
}

export function buildFormulaContext(args: {
  rowValues?: Record<string, unknown>;
  rowTitle?: string;
  properties: Array<{ _id: string; name: string }>;
}): FormulaContext {
  const out: FormulaContext = {};
  const values = args.rowValues || {};

  Object.entries(values).forEach(([key, val]) => {
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val == null) {
      out[key] = val;
    }
  });

  if (args.rowTitle) {
    out.title = args.rowTitle;
  }

  args.properties.forEach((p) => {
    const raw = values[p._id];
    const normalized = p.name.trim();
    if (!normalized) return;

    if (
      typeof raw === "string" ||
      typeof raw === "number" ||
      typeof raw === "boolean" ||
      raw == null
    ) {
      out[normalized] = raw as Primitive;
      out[normalized.toLowerCase()] = raw as Primitive;
    }
  });

  return out;
}

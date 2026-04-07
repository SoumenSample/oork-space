// /* eslint-disable @typescript-eslint/no-explicit-any */
// export function evaluateFormula(formula: string, row: any, properties: any[]) {
//   try {
//     let parsed = formula;

//     // Replace prop() references with actual values
//     parsed = parsed.replace(/prop\("([^"]+)"\)/g, (_, name) => {
//       // Handle metadata properties
//       if (name === "_name") {
//         // Get the first text property as the name, or use row ID
//         const firstTextCol = properties.find(p => p.type === 'text');
//         const nameValue = firstTextCol ? row.cells?.[firstTextCol._id] : row._id;
//         return `"${nameValue || 'Untitled'}"`;
//       }
//       if (name === "_createdAt") {
//         return `"${new Date(row.createdAt).toLocaleDateString()}"`;
//       }
//       if (name === "_createdBy") {
//         return `"Unknown User"`;
//       }
//       if (name === "_lastEditedAt") {
//         return `"${new Date(row.updatedAt).toLocaleDateString()}"`;
//       }
//       if (name === "_lastEditedBy") {
//         return `"Unknown User"`;
//       }
      
//       // Handle regular properties
//       const prop = properties.find((p) => p.name === name);
//       if (!prop) {
//         console.warn(`Property "${name}" not found in properties list`);
//         return "0"; // Return string "0" to avoid undefined issues
//       }
//       const cellValue = row.cells?.[prop._id];
      
//       // Convert to number if possible, otherwise return 0
//       if (cellValue === undefined || cellValue === null || cellValue === "") {
//         return "0";
//       }
      
//       // If it's already a number, return it as string
//       if (typeof cellValue === "number") {
//         return String(cellValue);
//       }
      
//       // Try to parse as number
//       const numValue = Number(cellValue);
//       if (!isNaN(numValue)) {
//         return String(numValue);
//       }
      
//       // If it's a string that can't be converted, wrap in quotes for string operations
//       return `"${cellValue}"`;
//     });

//     // Define helper functions with non-reserved names
//     const _if = (cond: boolean, a: any, b: any) => (cond ? a : b);
//     const _concat = (...args: any[]) => args.join("");
//     const _length = (str: string) => String(str).length;
//     const _round = (num: number) => Math.round(num);
//     const _sum = (...args: any[]) => args.reduce((acc, val) => acc + Number(val), 0);
//     const _add = (a: any, b: any) => Number(a) + Number(b);
//     const _subtract = (a: any, b: any) => Number(a) - Number(b);
//     const _multiply = (a: any, b: any) => Number(a) * Number(b);
//     const _divide = (a: any, b: any) => Number(a) / Number(b);

//     // Replace function calls with safe names
//     parsed = parsed.replace(/\bif\(/g, "_if(");
//     parsed = parsed.replace(/\bconcat\(/g, "_concat(");
//     parsed = parsed.replace(/\blength\(/g, "_length(");
//     parsed = parsed.replace(/\bround\(/g, "_round(");
//     parsed = parsed.replace(/\bsum\(/g, "_sum(");
//     parsed = parsed.replace(/\badd\(/g, "_add(");
//     parsed = parsed.replace(/\bsubtract\(/g, "_subtract(");
//     parsed = parsed.replace(/\bmultiply\(/g, "_multiply(");
//     parsed = parsed.replace(/\bdivide\(/g, "_divide(");

//     const result = new Function(
//       "_if", "_concat", "_length", "_round", "_sum", "_add", "_subtract", "_multiply", "_divide",
//       `"use strict"; return ${parsed}`
//     )(_if, _concat, _length, _round, _sum, _add, _subtract, _multiply, _divide);
    
//     // Handle different result types
//     if (result === undefined || result === null) {
//       return "";
//     }
    
//     // If result is NaN, return empty or error
//     if (typeof result === "number" && isNaN(result)) {
//       return "";
//     }
    
//     // If result is a number, return it
//     if (typeof result === "number") {
//       return result;
//     }
    
//     // If result is boolean, return it as text
//     if (typeof result === "boolean") {
//       return result ? "true" : "false";
//     }
    
//     // Otherwise return as string
//     return String(result);
//   } catch (err) {
//     console.error("Formula evaluation error:", err);
//     return "Error";
//   }
// }
// /* eslint-disable @typescript-eslint/no-explicit-any */
// export function evaluateFormula(formula: string, row: any, properties: any[]) {
//   try {
//     let parsed = formula;

//     // Replace prop() references with actual values
//     parsed = parsed.replace(/prop\("([^"]+)"\)/g, (_, name) => {
//       // Handle metadata properties
//       if (name === "_name") {
//         // Get the first text property as the name, or use row ID
//         const firstTextCol = properties.find(p => p.type === 'text');
//         const nameValue = firstTextCol ? row.cells?.[firstTextCol._id] : row._id;
//         return `"${nameValue || 'Untitled'}"`;
//       }
//       if (name === "_createdAt") {
//         return `"${new Date(row.createdAt).toLocaleDateString()}"`;
//       }
//       if (name === "_createdBy") {
//         return `"Unknown User"`;
//       }
//       if (name === "_lastEditedAt") {
//         return `"${new Date(row.updatedAt).toLocaleDateString()}"`;
//       }
//       if (name === "_lastEditedBy") {
//         return `"Unknown User"`;
//       }

//       // Handle regular properties
//       const prop = properties.find((p) => p.name === name);
//       if (!prop) {
//         console.warn(`Property "${name}" not found in properties list`);
//         return "0"; // Return string "0" to avoid undefined issues
//       }
//       const cellValue = row.cells?.[prop._id];

//       // Convert to number if possible, otherwise return 0
//       if (cellValue === undefined || cellValue === null || cellValue === "") {
//         return "0";
//       }

//       // If it's already a number, return it as string
//       if (typeof cellValue === "number") {
//         return String(cellValue);
//       }

//       // Try to parse as number
//       const numValue = Number(cellValue);
//       if (!isNaN(numValue)) {
//         return String(numValue);
//       }

//       // If it's a string that can't be converted, wrap in quotes for string operations
//       return `"${cellValue}"`;
//     });

//     // Define helper functions with non-reserved names
//     const _if = (cond: boolean, a: any, b: any) => (cond ? a : b);
//     const _concat = (...args: any[]) => args.join("");
//     const _length = (str: string) => String(str).length;
//     const _round = (num: number) => Math.round(num);
//     const _sum = (...args: any[]) => args.reduce((acc, val) => acc + Number(val), 0);
//     const _add = (a: any, b: any) => Number(a) + Number(b);
//     const _subtract = (a: any, b: any) => Number(a) - Number(b);
//     const _multiply = (a: any, b: any) => Number(a) * Number(b);
//     const _divide = (a: any, b: any) => Number(a) / Number(b);

//     // Replace function calls with safe names
//     parsed = parsed.replace(/\bif\(/g, "_if(");
//     parsed = parsed.replace(/\bconcat\(/g, "_concat(");
//     parsed = parsed.replace(/\blength\(/g, "_length(");
//     parsed = parsed.replace(/\bround\(/g, "_round(");
//     parsed = parsed.replace(/\bsum\(/g, "_sum(");
//     parsed = parsed.replace(/\badd\(/g, "_add(");
//     parsed = parsed.replace(/\bsubtract\(/g, "_subtract(");
//     parsed = parsed.replace(/\bmultiply\(/g, "_multiply(");
//     parsed = parsed.replace(/\bdivide\(/g, "_divide(");

//     const result = new Function(
//       "_if", "_concat", "_length", "_round", "_sum", "_add", "_subtract", "_multiply", "_divide",
//       `"use strict"; return ${parsed}`
//     )(_if, _concat, _length, _round, _sum, _add, _subtract, _multiply, _divide);

//     // Handle different result types
//     if (result === undefined || result === null) {
//       return "";
//     }

//     // If result is NaN, return empty or error
//     if (typeof result === "number" && isNaN(result)) {
//       return "";
//     }

//     // If result is a number, return it
//     if (typeof result === "number") {
//       return result;
//     }

//     // If result is boolean, return it as text
//     if (typeof result === "boolean") {
//       return result ? "true" : "false";
//     }

//     // Otherwise return as string
//     return String(result);
//   } catch (err) {
//     console.error("Formula evaluation error:", err);
//     return "Error";
//   }
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
export function evaluateFormula(formula: string, row: any, properties: any[]) {
  try {
    if (!formula || !formula.trim()) return "";

    let parsed = formula;

    /* -------------------------
       Replace prop() references
    -------------------------- */
    parsed = parsed.replace(/prop\("([^"]+)"\)/g, (_, name) => {
      // Metadata properties
      if (name === "_name") {
        const firstTextCol = properties.find((p) => p.type === "text");
        const nameValue = firstTextCol
          ? row.cells?.[firstTextCol._id]
          : row._id;
        return `"${nameValue || "Untitled"}"`;
      }

      if (name === "_createdAt") {
        return `"${new Date(row.createdAt).toLocaleDateString()}"`;
      }

      if (name === "_createdBy") {
        return `"Unknown User"`;
      }

      if (name === "_lastEditedAt") {
        return `"${new Date(row.updatedAt).toLocaleDateString()}"`;
      }

      if (name === "_lastEditedBy") {
        return `"Unknown User"`;
      }

      // Regular properties
      const prop = properties.find((p) => p.name === name);

      if (!prop) {
        console.warn(`Property "${name}" not found`);
        return "0";
      }

      const cellValue = row.cells?.[prop._id];

      if (cellValue === undefined || cellValue === null || cellValue === "") {
        return "0";
      }

      if (typeof cellValue === "number") {
        return String(cellValue);
      }

      const numValue = Number(cellValue);
      if (!isNaN(numValue)) {
        return String(numValue);
      }

      return `"${String(cellValue).replace(/"/g, '\\"')}"`;
    });

    /* -------------------------
       Define helper functions
    -------------------------- */

    const _if = (cond: boolean, a: any, b: any) => (cond ? a : b);
    const _concat = (...args: any[]) => args.join("");
    const _length = (str: string) => String(str).length;
    const _round = (num: number) => Math.round(Number(num));
    const _sum = (...args: any[]) =>
      args.reduce((acc, val) => acc + Number(val || 0), 0);
    const _add = (a: any, b: any) => Number(a || 0) + Number(b || 0);
    const _subtract = (a: any, b: any) => Number(a || 0) - Number(b || 0);
    const _multiply = (a: any, b: any) => Number(a || 0) * Number(b || 0);
    const _divide = (a: any, b: any) =>
      Number(b || 0) === 0 ? 0 : Number(a || 0) / Number(b || 0);

    /* -------------------------
       Replace function names
    -------------------------- */

    parsed = parsed.replace(/\bif\(/g, "_if(");
    parsed = parsed.replace(/\bconcat\(/g, "_concat(");
    parsed = parsed.replace(/\blength\(/g, "_length(");
    parsed = parsed.replace(/\bround\(/g, "_round(");
    parsed = parsed.replace(/\bsum\(/g, "_sum(");
    parsed = parsed.replace(/\badd\(/g, "_add(");
    parsed = parsed.replace(/\bsubtract\(/g, "_subtract(");
    parsed = parsed.replace(/\bmultiply\(/g, "_multiply(");
    parsed = parsed.replace(/\bdivide\(/g, "_divide(");

    /* -------------------------
       🛑 SAFETY FIX
    -------------------------- */

    parsed = parsed?.trim() || "";

    // Remove trailing operators like + - * etc
    parsed = parsed.replace(/[+\-*/=<>!,]+$/, "");

    // Remove stray closing brace
    if (parsed.endsWith("}")) {
      parsed = parsed.slice(0, -1);
    }

    if (!parsed) return "";

    /* -------------------------
       Safe execution
    -------------------------- */

    const result = new Function(
      "_if",
      "_concat",
      "_length",
      "_round",
      "_sum",
      "_add",
      "_subtract",
      "_multiply",
      "_divide",
      `"use strict"; return (${parsed})`,
    )(_if, _concat, _length, _round, _sum, _add, _subtract, _multiply, _divide);

    /* -------------------------
       Result handling
    -------------------------- */

    if (result === undefined || result === null) return "";

    if (typeof result === "number" && isNaN(result)) return "";

    if (typeof result === "number") return result;

    if (typeof result === "boolean") return result ? "true" : "false";

    return String(result);
  } catch (err) {
    console.error("Formula evaluation error:", err);
    return "Error";
  }
}
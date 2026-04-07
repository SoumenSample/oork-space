export const formulaHelpers = {
  if: (cond: boolean, a: any, b: any) => (cond ? a : b),
  concat: (...args: any[]) => args.join(""),
  length: (str: string) => str.length,
};
export type PropertyType = "text" | "number" | "formula";

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  formula?: string;
}
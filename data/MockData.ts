export const properties = [
  { id: "1", name: "Price", type: "number" },
  { id: "2", name: "Qty", type: "number" },
  {
    id: "3",
    name: "Total",
    type: "formula",
    formula: 'prop("Price") * prop("Qty")',
  },
];

export const rows = [
  {
    id: "r1",
    values: {
      "1": 100,
      "2": 2,
    },
  },
];
// "use client";

// import { Column } from "@/app/store/TableStore";
// import { FormulaToken } from "./FormulaEditor";
// import { useState, useEffect, useMemo } from "react";

// type Suggestion = {
//   label: string;
//   token: FormulaToken;
//   description?: string;
// };

// export default function FormulaSuggestions({
//   properties,
//   mode,
//   filterText = "",
//   onSelect,
// }: {
//   properties: Column[];
//   mode: "token" | "operator";
//   filterText?: string;
//   onSelect: (token: FormulaToken) => void;
// }) {
//   const [selectedIndex, setSelectedIndex] = useState(0);

//   // Metadata properties (like Notion)
//   const metadataProperties: Suggestion[] = useMemo(
//     () => {
//       const metadata = [
//         {
//           label: "Name",
//           token: {
//             type: "property" as const,
//             value: `prop("_name")`,
//             display: "Name",
//           },
//           description: "Row name/title",
//         },
//         {
//           label: "Created time",
//           token: {
//             type: "property" as const,
//             value: `prop("_createdAt")`,
//             display: "Created time",
//           },
//           description: "Creation date",
//         },
//         {
//           label: "Created by",
//           token: {
//             type: "property" as const,
//             value: `prop("_createdBy")`,
//             display: "Created by",
//           },
//           description: "Creator name",
//         },
//         {
//           label: "Last edited time",
//           token: {
//             type: "property" as const,
//             value: `prop("_lastEditedAt")`,
//             display: "Last edited time",
//           },
//           description: "Last update date",
//         },
//         {
//           label: "Last edited by",
//           token: {
//             type: "property" as const,
//             value: `prop("_lastEditedBy")`,
//             display: "Last edited by",
//           },
//           description: "Last editor name",
//         },
//       ];
      
//       return metadata.filter((m) =>
//         m.label.toLowerCase().includes(filterText.toLowerCase())
//       );
//     },
//     [filterText]
//   );

//   // Property suggestions
//   const propertySuggestions: Suggestion[] = useMemo(
//     () =>
//       properties
//         .filter((p) => p.name.toLowerCase().includes(filterText.toLowerCase()))
//         .map((p) => ({
//           label: p.name,
//           token: {
//             type: "property" as const,
//             value: `prop("${p.name}")`,
//             display: p.name,
//           },
//           description: p.type,
//         })),
//     [properties, filterText]
//   );

//   // Function suggestions
//   const functionSuggestions: Suggestion[] = useMemo(
//     () =>
//       [
//         {
//           label: "if",
//           token: {
//             type: "function" as const,
//             value: "if()",
//             display: "if",
//           },
//           description: "Conditional logic",
//         },
//         {
//           label: "concat",
//           token: {
//             type: "function" as const,
//             value: "concat()",
//             display: "concat",
//           },
//           description: "Combine text",
//         },
//         {
//           label: "length",
//           token: {
//             type: "function" as const,
//             value: "length()",
//             display: "length",
//           },
//           description: "Text length",
//         },
//         {
//           label: "round",
//           token: {
//             type: "function" as const,
//             value: "round()",
//             display: "round",
//           },
//           description: "Round number",
//         },
//         {
//           label: "sum",
//           token: {
//             type: "function" as const,
//             value: "sum()",
//             display: "sum",
//           },
//           description: "Add numbers",
//         },
//         {
//           label: "add",
//           token: {
//             type: "function" as const,
//             value: "add()",
//             display: "add",
//           },
//           description: "Add two numbers",
//         },
//         {
//           label: "subtract",
//           token: {
//             type: "function" as const,
//             value: "subtract()",
//             display: "subtract",
//           },
//           description: "Subtract numbers",
//         },
//         {
//           label: "multiply",
//           token: {
//             type: "function" as const,
//             value: "multiply()",
//             display: "multiply",
//           },
//           description: "Multiply numbers",
//         },
//         {
//           label: "divide",
//           token: {
//             type: "function" as const,
//             value: "divide()",
//             display: "divide",
//           },
//           description: "Divide numbers",
//         },
//       ].filter((f) => f.label.toLowerCase().includes(filterText.toLowerCase())),
//     [filterText]
//   );

//   // Operator suggestions
//   const operatorSuggestions: Suggestion[] = useMemo(
//     () => [
//       {
//         label: "+ Add",
//         token: { type: "operator" as const, value: "+", display: "+" },
//         description: "Addition",
//       },
//       {
//         label: "- Subtract",
//         token: { type: "operator" as const, value: "-", display: "-" },
//         description: "Subtraction",
//       },
//       {
//         label: "* Multiply",
//         token: { type: "operator" as const, value: "*", display: "×" },
//         description: "Multiplication",
//       },
//       {
//         label: "/ Divide",
//         token: { type: "operator" as const, value: "/", display: "÷" },
//         description: "Division",
//       },
//       {
//         label: "( Open",
//         token: { type: "operator" as const, value: "(", display: "(" },
//         description: "Open parenthesis",
//       },
//       {
//         label: ") Close",
//         token: { type: "operator" as const, value: ")", display: ")" },
//         description: "Close parenthesis",
//       },
//       {
//         label: ", Comma",
//         token: { type: "operator" as const, value: ",", display: "," },
//         description: "Separator",
//       },
//       {
//         label: "== Equal",
//         token: { type: "operator" as const, value: "==", display: "==" },
//         description: "Equals comparison",
//       },
//       {
//         label: "!= Not Equal",
//         token: { type: "operator" as const, value: "!=", display: "!=" },
//         description: "Not equals",
//       },
//       {
//         label: "> Greater",
//         token: { type: "operator" as const, value: ">", display: ">" },
//         description: "Greater than",
//       },
//       {
//         label: "< Less",
//         token: { type: "operator" as const, value: "<", display: "<" },
//         description: "Less than",
//       },
//     ],
//     []
//   );

//   // Get all suggestions based on mode
//   const allSuggestions = useMemo(
//     () =>
//       mode === "operator"
//         ? operatorSuggestions
//         : [...metadataProperties, ...propertySuggestions, ...functionSuggestions],
//     [mode, operatorSuggestions, metadataProperties, propertySuggestions, functionSuggestions]
//   );

//   // Clamp selected index
//   const clampedIndex = Math.min(selectedIndex, Math.max(0, allSuggestions.length - 1));

//   // Keyboard navigation
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "ArrowDown") {
//         e.preventDefault();
//         setSelectedIndex((prev) => (prev + 1) % allSuggestions.length);
//       } else if (e.key === "ArrowUp") {
//         e.preventDefault();
//         setSelectedIndex((prev) => (prev - 1 + allSuggestions.length) % allSuggestions.length);
//       } else if (e.key === "Enter" && allSuggestions[clampedIndex]) {
//         e.preventDefault();
//         onSelect(allSuggestions[clampedIndex].token);
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [clampedIndex, allSuggestions, onSelect]);

//   // Show operators or properties/functions based on mode
//   if (mode === "operator") {
//     return (
//       <div className="border rounded-xl bg-white dark:bg-[#2a2a2a] shadow-lg p-2 w-full max-h-60 overflow-y-auto">
//         <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1 font-semibold">
//           Operators
//         </p>
//         {operatorSuggestions.map((item, i) => (
//           <div
//             key={i}
//             onClick={() => onSelect(item.token)}
//             className={`px-3 py-2 rounded cursor-pointer text-sm flex justify-between items-center ${
//               i === clampedIndex
//                 ? "bg-blue-500 text-white"
//                 : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
//             }`}
//           >
//             <span className="font-medium">{item.label}</span>
//             <span className={`text-xs ${i === clampedIndex ? "text-blue-100" : "text-gray-400"}`}>
//               {item.description}
//             </span>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   // Token mode - show properties and functions
//   return (
//     <div className="border rounded-xl bg-white dark:bg-[#2a2a2a] shadow-lg p-2 w-full max-h-80 overflow-y-auto">
//       {/* Metadata Properties */}
//       {metadataProperties.length > 0 && (
//         <div className="mb-3">
//           <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1 font-semibold">
//             Metadata
//           </p>
//           {metadataProperties.map((item, i) => (
//             <div
//               key={i}
//               onClick={() => onSelect(item.token)}
//               className={`px-3 py-2 rounded cursor-pointer text-sm flex justify-between items-center ${
//                 i === clampedIndex
//                   ? "bg-blue-500 text-white"
//                   : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
//               }`}
//             >
//               <span className="font-medium">{item.label}</span>
//               <span className={`text-xs ${i === clampedIndex ? "text-blue-100" : "text-gray-400"}`}>
//                 {item.description}
//               </span>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Properties */}
//       {propertySuggestions.length > 0 && (
//         <div className="mb-3">
//           <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1 font-semibold">
//             Properties
//           </p>
//           {propertySuggestions.map((item, i) => {
//             const actualIndex = i + metadataProperties.length;
//             return (
//               <div
//                 key={i}
//                 onClick={() => onSelect(item.token)}
//                 className={`px-3 py-2 rounded cursor-pointer text-sm flex justify-between items-center ${
//                   actualIndex === clampedIndex
//                     ? "bg-blue-500 text-white"
//                     : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
//                 }`}
//               >
//                 <span className="font-medium">{item.label}</span>
//                 <span className={`text-xs capitalize ${actualIndex === clampedIndex ? "text-blue-100" : "text-gray-400"}`}>
//                   {item.description}
//                 </span>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* Functions */}
//       {functionSuggestions.length > 0 && (
//         <div>
//           <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1 font-semibold">
//             Functions
//           </p>
//           {functionSuggestions.map((item, i) => {
//             const actualIndex = i + metadataProperties.length + propertySuggestions.length;
//             return (
//               <div
//                 key={i}
//                 onClick={() => onSelect(item.token)}
//                 className={`px-3 py-2 rounded cursor-pointer text-sm flex justify-between items-center ${
//                   actualIndex === clampedIndex
//                     ? "bg-blue-500 text-white"
//                     : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
//                 }`}
//               >
//                 <span className="font-medium">{item.label}</span>
//                 <span className={`text-xs ${actualIndex === clampedIndex ? "text-blue-100" : "text-gray-400"}`}>
//                   {item.description}
//                 </span>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* No results */}
//       {propertySuggestions.length === 0 && functionSuggestions.length === 0 && (
//         <p className="text-sm text-gray-400 text-center py-4">
//           No matches found
//         </p>
//       )}
//     </div>
//   );
// }
"use client";

import { FormulaToken, FormulaProperty } from "./FormulaEditor";
import { useState, useEffect, useMemo } from "react";

type Suggestion = {
  label: string;
  token: FormulaToken;
  description?: string;
};

export default function FormulaSuggestions({
  properties,
  mode,
  filterText = "",
  onSelect,
}: {
  properties: FormulaProperty[];
  mode: "token" | "operator";
  filterText?: string;
  onSelect: (token: FormulaToken) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Metadata properties (like Notion)
  const metadataProperties: Suggestion[] = useMemo(() => {
    const metadata = [
      {
        label: "Name",
        token: {
          type: "property" as const,
          value: `prop("_name")`,
          display: "Name",
        },
        description: "Row name/title",
      },
      {
        label: "Created time",
        token: {
          type: "property" as const,
          value: `prop("_createdAt")`,
          display: "Created time",
        },
        description: "Creation date",
      },
      {
        label: "Created by",
        token: {
          type: "property" as const,
          value: `prop("_createdBy")`,
          display: "Created by",
        },
        description: "Creator name",
      },
      {
        label: "Last edited time",
        token: {
          type: "property" as const,
          value: `prop("_lastEditedAt")`,
          display: "Last edited time",
        },
        description: "Last update date",
      },
      {
        label: "Last edited by",
        token: {
          type: "property" as const,
          value: `prop("_lastEditedBy")`,
          display: "Last edited by",
        },
        description: "Last editor name",
      },
    ];

    return metadata.filter((m) =>
      m.label.toLowerCase().includes(filterText.toLowerCase()),
    );
  }, [filterText]);

  // Property suggestions
  const propertySuggestions: Suggestion[] = useMemo(
    () =>
      properties
        .filter((p) => p.name.toLowerCase().includes(filterText.toLowerCase()))
        .map((p) => ({
          label: p.name,
          token: {
            type: "property" as const,
            value: `prop("${p.name}")`,
            display: p.name,
          },
          description: p.type,
        })),
    [properties, filterText],
  );

  // Function suggestions
  const functionSuggestions: Suggestion[] = useMemo(
    () =>
      [
        {
          label: "if",
          token: {
            type: "function" as const,
            value: "if()",
            display: "if",
          },
          description: "Conditional logic",
        },
        {
          label: "concat",
          token: {
            type: "function" as const,
            value: "concat()",
            display: "concat",
          },
          description: "Combine text",
        },
        {
          label: "length",
          token: {
            type: "function" as const,
            value: "length()",
            display: "length",
          },
          description: "Text length",
        },
        {
          label: "round",
          token: {
            type: "function" as const,
            value: "round()",
            display: "round",
          },
          description: "Round number",
        },
        {
          label: "sum",
          token: {
            type: "function" as const,
            value: "sum()",
            display: "sum",
          },
          description: "Add numbers",
        },
        {
          label: "add",
          token: {
            type: "function" as const,
            value: "add()",
            display: "add",
          },
          description: "Add two numbers",
        },
        {
          label: "subtract",
          token: {
            type: "function" as const,
            value: "subtract()",
            display: "subtract",
          },
          description: "Subtract numbers",
        },
        {
          label: "multiply",
          token: {
            type: "function" as const,
            value: "multiply()",
            display: "multiply",
          },
          description: "Multiply numbers",
        },
        {
          label: "divide",
          token: {
            type: "function" as const,
            value: "divide()",
            display: "divide",
          },
          description: "Divide numbers",
        },
      ].filter((f) => f.label.toLowerCase().includes(filterText.toLowerCase())),
    [filterText],
  );

  // Operator suggestions
  const operatorSuggestions: Suggestion[] = useMemo(
    () => [
      {
        label: "+ Add",
        token: { type: "operator" as const, value: "+", display: "+" },
        description: "Addition",
      },
      {
        label: "- Subtract",
        token: { type: "operator" as const, value: "-", display: "-" },
        description: "Subtraction",
      },
      {
        label: "* Multiply",
        token: { type: "operator" as const, value: "*", display: "×" },
        description: "Multiplication",
      },
      {
        label: "/ Divide",
        token: { type: "operator" as const, value: "/", display: "÷" },
        description: "Division",
      },
      {
        label: "( Open",
        token: { type: "operator" as const, value: "(", display: "(" },
        description: "Open parenthesis",
      },
      {
        label: ") Close",
        token: { type: "operator" as const, value: ")", display: ")" },
        description: "Close parenthesis",
      },
      {
        label: ", Comma",
        token: { type: "operator" as const, value: ",", display: "," },
        description: "Separator",
      },
      {
        label: "== Equal",
        token: { type: "operator" as const, value: "==", display: "==" },
        description: "Equals comparison",
      },
      {
        label: "!= Not Equal",
        token: { type: "operator" as const, value: "!=", display: "!=" },
        description: "Not equals",
      },
      {
        label: "> Greater",
        token: { type: "operator" as const, value: ">", display: ">" },
        description: "Greater than",
      },
      {
        label: "< Less",
        token: { type: "operator" as const, value: "<", display: "<" },
        description: "Less than",
      },
    ],
    [],
  );

  // Get all suggestions based on mode
  const allSuggestions = useMemo(
    () =>
      mode === "operator"
        ? operatorSuggestions
        : [
            ...metadataProperties,
            ...propertySuggestions,
            ...functionSuggestions,
          ],
    [
      mode,
      operatorSuggestions,
      metadataProperties,
      propertySuggestions,
      functionSuggestions,
    ],
  );

  // Clamp selected index
  const clampedIndex = Math.min(
    selectedIndex,
    Math.max(0, allSuggestions.length - 1),
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + allSuggestions.length) % allSuggestions.length,
        );
      } else if (e.key === "Enter" && allSuggestions[clampedIndex]) {
        e.preventDefault();
        onSelect(allSuggestions[clampedIndex].token);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clampedIndex, allSuggestions, onSelect]);

  // Show operators or properties/functions based on mode
  if (mode === "operator") {
    return (
      <div className="border rounded-xl bg-white dark:bg-[#2a2a2a] shadow-lg p-2 w-full max-h-60 overflow-y-auto">
        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1 font-semibold">
          Operators
        </p>
        {operatorSuggestions.map((item, i) => (
          <div
            key={i}
            onClick={() => onSelect(item.token)}
            className={`px-3 py-2 rounded cursor-pointer text-sm flex justify-between items-center ${
              i === clampedIndex
                ? "bg-blue-500 text-white"
                : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
          >
            <span className="font-medium">{item.label}</span>
            <span
              className={`text-xs ${i === clampedIndex ? "text-blue-100" : "text-gray-400"}`}
            >
              {item.description}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Token mode - show properties and functions
  return (
    <div className="border rounded-xl bg-white dark:bg-[#2a2a2a] shadow-lg p-2 w-full max-h-80 overflow-y-auto">
      {/* Metadata Properties */}
      {metadataProperties.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1 font-semibold">
            Metadata
          </p>
          {metadataProperties.map((item, i) => (
            <div
              key={i}
              onClick={() => onSelect(item.token)}
              className={`px-3 py-2 rounded cursor-pointer text-sm flex justify-between items-center ${
                i === clampedIndex
                  ? "bg-blue-500 text-white"
                  : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
            >
              <span className="font-medium">{item.label}</span>
              <span
                className={`text-xs ${i === clampedIndex ? "text-blue-100" : "text-gray-400"}`}
              >
                {item.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Properties */}
      {propertySuggestions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1 font-semibold">
            Properties
          </p>
          {propertySuggestions.map((item, i) => {
            const actualIndex = i + metadataProperties.length;
            return (
              <div
                key={i}
                onClick={() => onSelect(item.token)}
                className={`px-3 py-2 rounded cursor-pointer text-sm flex justify-between items-center ${
                  actualIndex === clampedIndex
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
              >
                <span className="font-medium">{item.label}</span>
                <span
                  className={`text-xs capitalize ${actualIndex === clampedIndex ? "text-blue-100" : "text-gray-400"}`}
                >
                  {item.description}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Functions */}
      {functionSuggestions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1 font-semibold">
            Functions
          </p>
          {functionSuggestions.map((item, i) => {
            const actualIndex =
              i + metadataProperties.length + propertySuggestions.length;
            return (
              <div
                key={i}
                onClick={() => onSelect(item.token)}
                className={`px-3 py-2 rounded cursor-pointer text-sm flex justify-between items-center ${
                  actualIndex === clampedIndex
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
              >
                <span className="font-medium">{item.label}</span>
                <span
                  className={`text-xs ${actualIndex === clampedIndex ? "text-blue-100" : "text-gray-400"}`}
                >
                  {item.description}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {propertySuggestions.length === 0 && functionSuggestions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No matches found
        </p>
      )}
    </div>
  );
}
// "use client";

// import { useRef, useState, useEffect } from "react";
// import { Column } from "@/app/store/TableStore";
// import FormulaSuggestions from "./FormulaSuggestions";

// export type FormulaToken = {
//   type: "property" | "function" | "operator" | "number" | "text";
//   value: string;
//   display: string;
// };

// export default function FormulaEditor({
//   properties,
//   value,
//   onChange,
// }: {
//   properties: Column[];
//   value: string;
//   onChange: (val: string) => void;
// }) {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const inputRef = useRef<HTMLInputElement | null>(null);
//   const [tokens, setTokens] = useState<FormulaToken[]>([]);
//   const [currentInput, setCurrentInput] = useState("");
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [suggestionMode, setSuggestionMode] = useState<"token" | "operator">("token");

//   // Convert tokens to formula string
//   const tokensToFormula = (tkns: FormulaToken[]) => {
//     if (tkns.length === 0) return "";
    
//     return tkns.map((t) => {
//       // Add spaces around operators (except parentheses)
//       if (t.type === "operator") {
//         if (t.value === "(" || t.value === ")") {
//           return t.value;
//         }
//         // Add spaces around arithmetic operators
//         return ` ${t.value} `;
//       }
//       return t.value;
//     }).join("").trim();
//   };

//   // Parse existing formula into tokens
//   const parseFormulaToTokens = (formula: string) => {
//     const parsed: FormulaToken[] = [];
//     // Remove extra spaces and parse
//     const cleanFormula = formula.trim();
//     const regex = /prop\("([^"]+)"\)|([+\-*/(),<>=!]+)|(\d+(?:\.\d+)?)|(\w+\([^)]*\))/g;
//     let match;

//     while ((match = regex.exec(cleanFormula)) !== null) {
//       if (match[1]) {
//         // Property
//         parsed.push({
//           type: "property",
//           value: `prop("${match[1]}")`,
//           display: match[1],
//         });
//       } else if (match[2]) {
//         // Operator
//         const operatorValue = match[2];
//         const operatorDisplay = 
//           operatorValue === "*" ? "×" : 
//           operatorValue === "/" ? "÷" : 
//           operatorValue;
        
//         parsed.push({
//           type: "operator",
//           value: operatorValue,
//           display: operatorDisplay,
//         });
//       } else if (match[3]) {
//         // Number (including decimals)
//         parsed.push({
//           type: "number",
//           value: match[3],
//           display: match[3],
//         });
//       } else if (match[4]) {
//         // Function
//         parsed.push({
//           type: "function",
//           value: match[4],
//           display: match[4],
//         });
//       }
//     }

//     setTokens(parsed);
//   };

//   // Parse formula string to tokens on mount or when value changes
//   useEffect(() => {
//     // Normalize both for comparison (remove extra spaces)
//     const normalizeFormula = (f: string) => f.replace(/\s+/g, ' ').trim();
//     const currentFormula = normalizeFormula(tokensToFormula(tokens));
//     const incomingFormula = normalizeFormula(value);
    
//     if (incomingFormula !== currentFormula) {
//       if (value.trim()) {
//         parseFormulaToTokens(value);
//       } else {
//         setTokens([]);
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [value]);

//   // Add token from suggestion
//   const addToken = (token: FormulaToken) => {
//     const newTokens = [...tokens, token];
//     setTokens(newTokens);
//     onChange(tokensToFormula(newTokens));
//     setCurrentInput("");
    
//     // Determine what to show next based on token type
//     if (token.type === "property" || token.type === "number") {
//       // After property/number, show operators
//       setSuggestionMode("operator");
//       setShowSuggestions(true);
//     } else if (token.type === "function") {
//       // After function, show properties/functions (for parameters)
//       setSuggestionMode("token");
//       setShowSuggestions(true);
//     } else if (token.type === "operator") {
//       // After most operators, show properties/functions
//       if (token.value === ")" || token.value === ",") {
//         // After closing paren or comma, could be operators (end of function) or more params
//         setSuggestionMode("operator");
//       } else {
//         setSuggestionMode("token");
//       }
//       setShowSuggestions(true);
//     }

//     // Focus input
//     setTimeout(() => inputRef.current?.focus(), 0);
//   };

//   // Remove last token on backspace
//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Backspace" && currentInput === "" && tokens.length > 0) {
//       e.preventDefault();
//       const newTokens = tokens.slice(0, -1);
//       setTokens(newTokens);
//       onChange(tokensToFormula(newTokens));
      
//       // Update suggestion mode based on last token
//       const lastToken = newTokens[newTokens.length - 1];
//       if (lastToken?.type === "operator") {
//         setSuggestionMode("token");
//       } else {
//         setSuggestionMode("operator");
//       }
//     }
//   };

//   // Handle input change
//   const handleInputChange = (val: string) => {
//     setCurrentInput(val);
    
//     // Show appropriate suggestions based on what's being typed
//     if (val.trim()) {
//       setSuggestionMode("token");
//       setShowSuggestions(true);
//     } else if (tokens.length === 0) {
//       setSuggestionMode("token");
//       setShowSuggestions(true);
//     }
//   };

//   // Handle Enter key to add number tokens
//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && currentInput.trim()) {
//       e.preventDefault();
      
//       // If it's a number, add as number token
//       if (/^\d+$/.test(currentInput.trim())) {
//         const numberToken: FormulaToken = {
//           type: "number",
//           value: currentInput.trim(),
//           display: currentInput.trim(),
//         };
//         addToken(numberToken);
//       }
//     }
//   };

//   // Handle clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
//         setShowSuggestions(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div className="relative space-y-2" ref={containerRef}>
//       {/* Token-based Editor */}
//       <div
//         className="w-full border rounded-xl p-3 min-h-[100px] outline-none focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-2 items-center cursor-text bg-white dark:bg-[#2a2a2a]"
//         onClick={() => inputRef.current?.focus()}
//       >
//         {/* Display Tokens */}
//         {tokens.map((token, idx) => (
//           <span
//             key={idx}
//             className={`px-2 py-1 rounded-md text-sm font-medium inline-flex items-center ${
//               token.type === "property"
//                 ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
//                 : token.type === "operator"
//                 ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
//                 : token.type === "function"
//                 ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
//                 : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
//             }`}
//           >
//             {token.display}
//           </span>
//         ))}

//         {/* Input for typing */}
//         <input
//           ref={inputRef}
//           type="text"
//           value={currentInput}
//           onChange={(e) => handleInputChange(e.target.value)}
//           onKeyDown={handleKeyDown}
//           onKeyPress={handleKeyPress}
//           onFocus={() => setShowSuggestions(true)}
//           placeholder={tokens.length === 0 ? "Start typing or select a property..." : ""}
//           className="flex-1 min-w-[100px] outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
//         />
//       </div>

//       {/* Suggestions Dropdown */}
//       {showSuggestions && (
//         <div className="absolute z-50 w-full mt-1">
//           <FormulaSuggestions
//             properties={properties}
//             mode={suggestionMode}
//             filterText={currentInput}
//             onSelect={(token) => addToken(token)}
//           />
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import { useRef, useState, useEffect } from "react";
import FormulaSuggestions from "./FormulaSuggestions";

export type FormulaProperty = {
  _id: string;
  name: string;
  type: string;
  formula?: string;
};

export type FormulaToken = {
  type: "property" | "function" | "operator" | "number" | "text";
  value: string;
  display: string;
};

export default function FormulaEditor({
  properties,
  value,
  onChange,
}: {
  properties: FormulaProperty[];
  value: string;
  onChange: (val: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tokens, setTokens] = useState<FormulaToken[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionMode, setSuggestionMode] = useState<"token" | "operator">(
    "token",
  );

  // Convert tokens to formula string
  const tokensToFormula = (tkns: FormulaToken[]) => {
    if (tkns.length === 0) return "";

    return tkns
      .map((t) => {
        // Add spaces around operators (except parentheses)
        if (t.type === "operator") {
          if (t.value === "(" || t.value === ")") {
            return t.value;
          }
          // Add spaces around arithmetic operators
          return ` ${t.value} `;
        }
        return t.value;
      })
      .join("")
      .trim();
  };

  // Parse existing formula into tokens
  const parseFormulaToTokens = (formula: string) => {
    const parsed: FormulaToken[] = [];
    // Remove extra spaces and parse
    const cleanFormula = formula.trim();
    const regex =
      /prop\("([^"]+)"\)|([+\-*/(),<>=!]+)|(\d+(?:\.\d+)?)|(\w+\([^)]*\))/g;
    let match;

    while ((match = regex.exec(cleanFormula)) !== null) {
      if (match[1]) {
        // Property
        parsed.push({
          type: "property",
          value: `prop("${match[1]}")`,
          display: match[1],
        });
      } else if (match[2]) {
        // Operator
        const operatorValue = match[2];
        const operatorDisplay =
          operatorValue === "*"
            ? "×"
            : operatorValue === "/"
              ? "÷"
              : operatorValue;

        parsed.push({
          type: "operator",
          value: operatorValue,
          display: operatorDisplay,
        });
      } else if (match[3]) {
        // Number (including decimals)
        parsed.push({
          type: "number",
          value: match[3],
          display: match[3],
        });
      } else if (match[4]) {
        // Function
        parsed.push({
          type: "function",
          value: match[4],
          display: match[4],
        });
      }
    }

    setTokens(parsed);
  };

  // Parse formula string to tokens on mount or when value changes
  useEffect(() => {
    // Normalize both for comparison (remove extra spaces)
    const normalizeFormula = (f: string) => f.replace(/\s+/g, " ").trim();
    const currentFormula = normalizeFormula(tokensToFormula(tokens));
    const incomingFormula = normalizeFormula(value);

    if (incomingFormula !== currentFormula) {
      if (value.trim()) {
        parseFormulaToTokens(value);
      } else {
        setTokens([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Add token from suggestion
  const addToken = (token: FormulaToken) => {
    const newTokens = [...tokens, token];
    setTokens(newTokens);
    onChange(tokensToFormula(newTokens));
    setCurrentInput("");

    // Determine what to show next based on token type
    if (token.type === "property" || token.type === "number") {
      // After property/number, show operators
      setSuggestionMode("operator");
      setShowSuggestions(true);
    } else if (token.type === "function") {
      // After function, show properties/functions (for parameters)
      setSuggestionMode("token");
      setShowSuggestions(true);
    } else if (token.type === "operator") {
      // After most operators, show properties/functions
      if (token.value === ")" || token.value === ",") {
        // After closing paren or comma, could be operators (end of function) or more params
        setSuggestionMode("operator");
      } else {
        setSuggestionMode("token");
      }
      setShowSuggestions(true);
    }

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Remove last token on backspace
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && currentInput === "" && tokens.length > 0) {
      e.preventDefault();
      const newTokens = tokens.slice(0, -1);
      setTokens(newTokens);
      onChange(tokensToFormula(newTokens));

      // Update suggestion mode based on last token
      const lastToken = newTokens[newTokens.length - 1];
      if (lastToken?.type === "operator") {
        setSuggestionMode("token");
      } else {
        setSuggestionMode("operator");
      }
    }
  };

  // Handle input change
  const handleInputChange = (val: string) => {
    setCurrentInput(val);

    // Show appropriate suggestions based on what's being typed
    if (val.trim()) {
      setSuggestionMode("token");
      setShowSuggestions(true);
    } else if (tokens.length === 0) {
      setSuggestionMode("token");
      setShowSuggestions(true);
    }
  };

  // Handle Enter key to add number tokens
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentInput.trim()) {
      e.preventDefault();

      // If it's a number, add as number token
      if (/^\d+$/.test(currentInput.trim())) {
        const numberToken: FormulaToken = {
          type: "number",
          value: currentInput.trim(),
          display: currentInput.trim(),
        };
        addToken(numberToken);
      }
    }
  };

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative space-y-2" ref={containerRef}>
      {/* Token-based Editor */}
      <div
        className="w-full border rounded-xl p-3 min-h-[100px] outline-none focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-2 items-center cursor-text bg-white dark:bg-[#2a2a2a]"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Display Tokens */}
        {tokens.map((token, idx) => (
          <span
            key={idx}
            className={`px-2 py-1 rounded-md text-sm font-medium inline-flex items-center ${
              token.type === "property"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : token.type === "operator"
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  : token.type === "function"
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
            }`}
          >
            {token.display}
          </span>
        ))}

        {/* Input for typing */}
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder={
            tokens.length === 0 ? "Start typing or select a property..." : ""
          }
          className="flex-1 min-w-[100px] outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1">
          <FormulaSuggestions
            properties={properties}
            mode={suggestionMode}
            filterText={currentInput}
            onSelect={(token) => addToken(token)}
          />
        </div>
      )}
    </div>
  );
}
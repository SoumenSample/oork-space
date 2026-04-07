# Formula Editor - Notion-like Implementation

## Features Implemented

### 1. **Token-Based UI** ✅
- Properties, operators, functions, and numbers are displayed as colored pills/tokens
- Visual distinction between different token types:
  - **Properties**: Blue pills (e.g., "Price", "Quantity")
  - **Operators**: Gray pills (e.g., +, -, ×, ÷)
  - **Functions**: Purple pills (e.g., "if(...)", "concat(...)")
  - **Numbers**: Green pills

### 2. **Smart Suggestions** ✅
- **Two modes**:
  - **Token mode**: Shows properties and functions (when starting or after an operator)
  - **Operator mode**: Shows mathematical operators (after selecting a property/function)
  
- **Auto-switching**: After selecting a property, operator suggestions appear automatically
- **Filtering**: Type to filter suggestions in real-time

### 3. **Keyboard Navigation** ✅
- **Arrow Up/Down**: Navigate through suggestions
- **Enter**: Select highlighted suggestion
- **Backspace**: Remove last token when input is empty (like Notion!)
- **Typing**: Filter suggestions or add numbers

### 4. **Database Storage** ✅
- Formulas are stored as strings in the database (e.g., `prop("Price") * prop("Qty")`)
- Automatically parsed into tokens for display
- Changes persist through the TableStore

## How to Use

### Basic Formula Creation
1. Click in the formula editor
2. Select a property from suggestions (or type to filter)
3. Select an operator (+, -, *, /)
4. Select another property or enter a number
5. Press Enter to commit numbers

### Example Workflow
```
1. Click editor → See properties & functions
2. Select "Price" → Token added: [Price]
3. See operators → Select "* Multiply"
4. Token added: [Price] [×]
5. Select "Quantity" → Token added: [Price] [×] [Quantity]
6. Formula saved: prop("Price") * prop("Qty")
```

### Backspace Support
- When the input field is empty, pressing Backspace removes the last token
- This mimics Notion's behavior perfectly!

### Available Functions
- **if**: Conditional logic
- **concat**: Combine text
- **length**: Get text length
- **round**: Round numbers
- **sum**: Add multiple values

### Available Operators
- **+** (Add)
- **-** (Subtract)
- **×** (Multiply)
- **÷** (Divide)
- **( )** (Parentheses)

## Technical Implementation

### Files Modified
1. **FormulaEditor.tsx**: Main editor with token-based UI
2. **FormulaSuggestions.tsx**: Smart suggestion dropdown with keyboard navigation
3. **FormulaModal.tsx**: Modal wrapper (unchanged)

### Key Functions
- `parseFormulaToTokens()`: Converts database string to visual tokens
- `tokensToFormula()`: Converts tokens back to database format
- `addToken()`: Adds new token and toggles suggestion mode
- `handleKeyDown()`: Manages backspace token removal

### Token Type
```typescript
type FormulaToken = {
  type: "property" | "function" | "operator" | "number" | "text";
  value: string;    // Database value: prop("Name")
  display: string;  // Visual display: "Name"
};
```

## Future Enhancements (Optional)
- [ ] Parentheses auto-pairing
- [ ] Drag-and-drop token reordering
- [ ] Syntax error highlighting
- [ ] Formula preview/calculation result
- [ ] Custom function support
- [ ] Token editing (double-click to modify)

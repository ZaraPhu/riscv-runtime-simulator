/*
The purpose of this file is to implement the RISC-V runtime simulator.
It will be used to simulate the execution of RISC-V instructions which are
retrieved from the assembly editor textarea and update the state of the
execution environment.
Author: Zara Phukan.
Creation Date: April 3, 2025.
*/

/*** Constants and Variables ***/
const assemblyEditor = document.querySelector(
  "#assembly-editor",
) as HTMLTextAreaElement | null;
const assembleButton = document.querySelector(
  "#assemble-button",
) as HTMLButtonElement | null;
const errorText = document.querySelector(
  "#error-text",
) as HTMLParagraphElement | null;
const resetRegistersButton = document.querySelector(
    "#reset-registers-btn"
) as HTMLButtonElement | null;


/*** Functions ***/
function raiseError(message: string = "") {
  /**
   * Displays an error message in the UI.
   * 
   * This function updates the error text display element with the provided message.
   * If the error text element is not found in the DOM (null), the function will
   * silently fail without displaying the message.
   * 
   * @param message - The error message to display
   */
  if (errorText != null) {
    errorText.textContent = message;
  }
}

function clearError() {
  raiseError();
}

function parseInput(instructionList: string[]): ParserResult {
  /**
   * Processes and validates assembly instructions.
   *
   * This function parses each instruction in the provided list, splitting it into its
   * components (opcode, operands) and verifying the format and values. It checks if the
   * instruction has a valid opcode, correct number of operands, and valid register names
   * or immediate values. When validation errors are found, the error status is set and
   * detailed error messages are generated with line numbers.
   *
   * The validation process follows these steps:
   * 1. Split each instruction into opcode and operands
   * 2. Verify the instruction is not empty
   * 3. Check that the opcode is recognized
   * 4. Validate that the number of operands matches the expected format
   * 5. Verify each operand is valid based on its expected type (register or immediate)
   *
   * Even if errors are found, the function will continue checking other instructions
   * to provide complete feedback to the user.
   *
   * @param instructionList - Array of assembly instruction strings to validate
   * @returns ParserResult object containing processed instructions, status, and detailed error messages
   */
  const parsingResult: ParserResult = {
    output: [],
    status: ParserStatus.OK,
    errMessage: "",
  };

  // Iterate through each instruction in the provided list
  for (let i: number = 0; i < instructionList.length; i++) {
    const destructuredInstruction: string[] = instructionList[i]
      .split(" ")
      .map((element) => element.replace(",", ""));
    // If the instruction is empty (after splitting), mark as error
    if (destructuredInstruction.length == 0) {
      parsingResult.status = ParserStatus.ERR;
      parsingResult.errMessage += `Line ${i + 1}: Empty instruction.\n`;
      continue;
    }

    // Look up the expected format for this instruction using its opcode
    const format: OperandType[] | undefined = INSTRUCTION_TO_FORMAT.get(
      destructuredInstruction[0],
    );
    // If the opcode isn't recognized, mark as error
    if (format == undefined) {
      parsingResult.status = ParserStatus.ERR;
      parsingResult.errMessage += `Line ${i + 1}: Instruction ${destructuredInstruction[0]} was not recognized.\n`;
      continue;
    }

    // Extract just the operands (everything after the opcode)
    const operands: string[] = destructuredInstruction.slice(1);
    // Check if the number of operands matches the expected format
    if (!(operands.length == format?.length)) {
      parsingResult.status = ParserStatus.ERR;
      parsingResult.errMessage += `Line ${i + 1}: ${operands.length} operands supplied but expected ${format?.length} operands.\n`;
      continue;
    }

    // Validate each operand based on its expected type
    for (let j: number = 0; j < format.length; j++) {
      const expectedOperand: OperandType = format[j];
      if (expectedOperand == OperandType.REGISTER) {
        // For register operands, check if it's a valid register name
        if (!Array.from(STRINGS_TO_REGISTERS.keys()).includes(operands[j])) {
          parsingResult.status = ParserStatus.ERR;
          parsingResult.errMessage += `Line ${i + 1}: Operand "${operands[j]}" is not a valid register.\n`;
          continue;
        }
      } else {
        // For immediate value operands, check if it's a valid number
        if (Number.isNaN(parseInt(operands[j]))) {
          parsingResult.status = ParserStatus.ERR;
          parsingResult.errMessage += `Line ${i + 1}: Operand "${operands[j]}" is not a number.\n`;
          continue;
        } 
        const operand_j: number = parseInt(operands[j]);
      }
    }
    // Add the processed instruction to the output regardless of validity
    parsingResult.output.push(destructuredInstruction);
  }
  return parsingResult;
}

function executeInstruction(destructuredInstruction: string[]): boolean {
  /**
   * Executes a RISC-V instruction based on its type.
   *
   * This function takes a destructured instruction array (opcode and operands),
   * determines its type (I-type, R-type, U-type, or no-operand type), and executes
   * the appropriate function handler for that instruction. Each instruction type
   * has different parameter requirements which are passed to the corresponding
   * function from their respective maps.
   *
   * @param destructuredInstruction - Array containing the opcode and operands
   * @returns true if execution was successful (currently always returns true)
   */
  // Get the instruction format type based on the opcode (first element)
  const instructionType: OperandType[] | undefined = INSTRUCTION_TO_FORMAT.get(
    destructuredInstruction[0],
  );
  // Validate instruction type is not undefined
  if (!instructionType) {
    raiseError(
      `Invalid instruction type for opcode ${destructuredInstruction[0]}`,
    );
    return false;
  }

  // Initialize status
  let status: boolean = true;
  
  // Execute the appropriate function based on instruction type
  switch (instructionType) {
    // I-type instructions (e.g., addi, lw) - typically use immediate values
    case I_TYPE:
      const iTypeCallable = I_INSTRUCTION_TO_FUNCTION.get(
        destructuredInstruction[0],
      )!;
      status = iTypeCallable(
        destructuredInstruction[1], // Destination register
        destructuredInstruction[2], // Source register
        destructuredInstruction[3], // Immediate value
      );
      break;

    // R-type instructions (e.g., add, sub) - register-register operations
    case R_TYPE:
      const rTypeCallable = R_INSTRUCTION_TO_FUNCTION.get(
        destructuredInstruction[0],
      )!;
      status = rTypeCallable(
        destructuredInstruction[1], // Destination register
        destructuredInstruction[2], // Source register 1
        destructuredInstruction[3], // Source register 2
      );
      break;

    // U-type instructions (e.g., lui) - upper immediate operations
    case U_TYPE:
      let uTypeCallable = U_INSTRUCTION_TO_FUNCTION.get(
        destructuredInstruction[0],
      )!;
      status = uTypeCallable(
        destructuredInstruction[1], // Destination register
        destructuredInstruction[2], // Immediate value
      );
      break;

    // Instructions with no operands
    case NONE_TYPE:
      let noneTypeCallable = NONE_INSTRUCTION_TO_FUNCTION.get(
        destructuredInstruction[0],
      )!;
      status = noneTypeCallable();
      break;

    case PSEUDO_TYPE:
      let pseudoTypeCallable = PSEUDO_INSTRUCTION_TO_FUNCTION.get(
        destructuredInstruction[0],
      )!;
      status = pseudoTypeCallable();
      break;

    // Handle unexpected instruction types
    default:
      console.log("Got an invalid instruction type.");
      break;
  }
  return status;
}

/*** Program Starting Point ***/
// Initialize registers with default values in binary
updateRegisterDisplays();

// adding event listeners which can change the representation
binaryCheck.addEventListener("click", () => { setRegisterBase(Base.BINARY); updateRegisterDisplays(); });
octalCheck.addEventListener("click", () => { setRegisterBase(Base.OCTAL); updateRegisterDisplays(); });
decimalCheck.addEventListener("click", () => { setRegisterBase(Base.DECIMAL); updateRegisterDisplays(); });
hexadecimalCheck.addEventListener("click", () => { setRegisterBase(Base.HEXADECIMAL); updateRegisterDisplays(); });

// Add click event listener to the assemble button
assembleButton?.addEventListener("click", () => {
  
  // Split the assembly editor's content into an array of instructions
  const instructionsList: string[] = assemblyEditor?.value.split("\n") || [];

  // Call the assembleInput function to validate the instructions
  // and store the result in status (true = valid, false = invalid)
  const parsingResult: ParserResult = parseInput(instructionsList);

  // If the assembly is invalid, log which line caused the error
  if (parsingResult.status == ParserStatus.ERR) {
    raiseError(parsingResult.errMessage);
  } else { 
    clearError();
    setRegister("pc", "0");
    const instructionList = parsingResult.output;
    let status: boolean = true;
    for (let i: number = 0; i < instructionList.length; i++) {
      status = executeInstruction(instructionList[i]);
      if (!status) {
        break;
      } else { 
        addi("pc", "pc", 1);
      }
    }
  }
});

resetRegistersButton?.addEventListener("click", () => {
  // reset all registers to 0
  zeroAllRegisters();
});

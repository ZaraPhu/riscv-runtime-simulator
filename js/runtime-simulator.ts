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

// custom object for returning the status from the parser
enum ParserStatus {
  OK,
  ERR,
}

interface ParserResult {
  output: string[][];
  status: ParserStatus.OK | ParserStatus.ERR;
  errOnLines: number[];
}

/*** Functions ***/
function raiseError(message: string) {
  if (errorText != null) {
    errorText.textContent = message;
  }
}
function parseInput(instructionList: string[]): ParserResult {
  /**
   * Processes and validates assembly instructions.
   *
   * This function parses each instruction in the provided list, splitting it into its
   * components (opcode, operands) and verifying the format and values. It checks if the
   * instruction has a valid opcode, correct number of operands, and valid register names
   * or immediate values. If any validation fails, the error status is set and the line
   * number is recorded.
   *
   * @param instructionList - Array of assembly instruction strings to validate
   * @returns ParserResult object containing processed instructions, status, and error line numbers
   */
  const parsingResult: ParserResult = {
    output: [],
    status: ParserStatus.OK,
    errOnLines: [],
  };

  // Iterate through each instruction in the provided list
  for (let i: number = 0; i < instructionList.length; i++) {
    const destructuredInstruction: string[] = instructionList[i]
      .split(" ")
      .map((element) => element.replace(",", ""));
    // If the instruction is empty (after splitting), mark as error
    if (destructuredInstruction.length == 0) {
      raiseError(`Line ${i + 1}: Empty instruction.`);
      parsingResult.status = ParserStatus.ERR;
      parsingResult.errOnLines.push(i);
      break;
    }

    // Look up the expected format for this instruction using its opcode
    const format: OperandType[] | undefined = INSTRUCTION_TO_FORMAT.get(
      destructuredInstruction[0],
    );
    // If the opcode isn't recognized, mark as error
    if (format == undefined) {
      raiseError(
        `Line ${i + 1}: Instruction ${destructuredInstruction[0]} was not recognized.`,
      );
      parsingResult.status = ParserStatus.ERR;
      parsingResult.errOnLines.push(i);
      break;
    }

    // Extract just the operands (everything after the opcode)
    const operands: string[] = destructuredInstruction.slice(1);
    // Check if the number of operands matches the expected format
    if (!(operands.length == format?.length)) {
      raiseError(
        `Line ${i + 1}: ${operands.length} operands supplied but expected ${format?.length} operands.`,
      );
      parsingResult.status = ParserStatus.ERR;
      parsingResult.errOnLines.push(i);
      break;
    }

    // Validate each operand based on its expected type
    for (let j: number = 0; j < format.length; j++) {
      const expectedOperand = format[j];
      if (expectedOperand == OperandType.REGISTER) {
        // For register operands, check if it's a valid register name
        if (!Array.from(STRINGS_TO_REGISTERS.keys()).includes(operands[j])) {
          raiseError(`Line ${i + 1}: Operand ${operands[j]} is not a valid register.`);
          parsingResult.status = ParserStatus.ERR;
          break;
        }
      } else {
        // For immediate value operands, check if it's a valid number
        if (Number.isNaN(parseInt(operands[j]))) {
          raiseError(`Line ${i + 1}: Operand ${operands[j]} is not a valid immediate.`);
          parsingResult.status = ParserStatus.ERR;
          break;
        }
      }
    }

    // If any errors were found in this instruction, record its line number
    if (parsingResult.status == ParserStatus.ERR) {
      parsingResult.errOnLines.push(i);
      break;
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
  // Validate instruction type
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

    // Handle unexpected instruction types
    default:
      console.log("Got an invalid instruction type.");
      break;
  }
  return status;
}

/*** Program Starting Point ***/
// Initialize registers with default values
registers.forEach((_, i) => {
  if (i > 0) {
    if (i < XLEN) {
      setRegister(`x${i}`, "0", 16);
    } else {
      setRegister("pc", "0", 16);
    }
  }
});

// Add click event listener to the assemble button
assembleButton?.addEventListener("click", () => {
  // Split the assembly editor's content into an array of instructions
  const instructionsList: string[] = assemblyEditor?.value.split("\n") || [];

  // Call the assembleInput function to validate the instructions
  // and store the result in status (true = valid, false = invalid)
  const parsingResult: ParserResult = parseInput(instructionsList);

  // If the assembly is invalid, log which line caused the error
  if (!(parsingResult.status == ParserStatus.ERR)) {
    parsingResult.output.forEach((destructuredInstruction) => {
      executeInstruction(destructuredInstruction);
    });
  }
});

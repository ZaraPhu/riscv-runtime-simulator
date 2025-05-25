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
const stepButton = document.querySelector(
  "#step-button",
) as HTMLButtonElement | null;
const errorText = document.querySelector(
  "#error-text",
) as HTMLParagraphElement | null;
const resetRegistersButton = document.querySelector(
  "#reset-registers-btn",
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

function appendParsingError(parsingResult: ParserResult, errMessage: string) {
  parsingResult.status = ParserStatus.ERR;
  parsingResult.errMessage += errMessage;
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
      appendParsingError(parsingResult, `Line ${i + 1}: Empty instruction.\n`);
      continue;
    }

    const instructionInfo: InstructionInfo | undefined = INSTRUCTION_TO_INFO.get(destructuredInstruction[0]);

    if (instructionInfo == undefined) {
      appendParsingError(
        parsingResult,
        `Line ${i + 1}: Instruction ${destructuredInstruction[0]} was not recognized.\n`,
      );
      continue;
    }
    const format: OperandType[] = instructionInfo.instructionFormat;

    // Extract just the operands (everything after the opcode)
    const operands: string[] = destructuredInstruction.slice(1);
    // Check if the number of operands matches the expected format
    if (!(operands.length == format!.length)) {
      appendParsingError(
        parsingResult,
        `Line ${i + 1}: ${operands.length} operands supplied but expected ${format!.length} operands.\n`,
      );
      continue;
    }

    // Validate each operand based on its expected type
    for (let j: number = 0; j < format.length; j++) {
      const expectedOperand: OperandType = format[j];
      if (expectedOperand == OperandType.REGISTER) {
        if (operands[j].localeCompare("pc") == 0) {
          appendParsingError(
            parsingResult,
            `Line ${i + 1}: Register 'pc' cannot be addressed by any instruction.\n`,
          );
          continue;
        }
        // For register operands, check if it's a valid register name
        if (!Array.from(STRINGS_TO_REGISTERS.keys()).includes(operands[j])) {
          appendParsingError(
            parsingResult,
            `Line ${i + 1}: Operand "${operands[j]}" is not a valid register.\n`,
          );
          continue;
        }
      } else {
        // For immediate value operands, check if it's a valid number
        if (Number.isNaN(parseInt(operands[j]))) {
          appendParsingError(
            parsingResult,
            `Line ${i + 1}: Operand "${operands[j]}" is not a number.\n`,
          );
          continue;
        }
        const operand_j: number = parseInt(operands[j]);
        if (
          operand_j < -1 * Math.pow(2, XLEN - 1) ||
          operand_j > Math.pow(2, XLEN - 1)
        ) {
          appendParsingError(
            parsingResult,
            `Line ${i + 1}: Immediate value for instruction ${destructuredInstruction[0]} must be between -${Math.pow(2, XLEN - 1)} and ${Math.pow(2, XLEN - 1)} (inclusive).\n`,
          );
          continue;
        }
      }
    }
    // Add the processed instruction to the output regardless of validity
    parsingResult.output.push(destructuredInstruction);
  }
  return parsingResult;
}

function fillInputParams(instructionFormat: OperandType[], destructuredInstruction: string[]): InstructionInput {
  const inputParams: InstructionInput = { rd: "", rs1: "", rs2: "", imm: 0 };
  switch (instructionFormat) {
    case I_TYPE:
      [inputParams.rd, inputParams.rs1] = destructuredInstruction.slice(1, 3);
      inputParams.imm = Number(destructuredInstruction[3]);
      break;
    case R_TYPE:
      [inputParams.rd, inputParams.rs1, inputParams.rs2] = destructuredInstruction.slice(1);
      break;
    case U_TYPE:
      inputParams.rd = destructuredInstruction[1];
      inputParams.imm = Number(destructuredInstruction[2]);
      break;
    case PSEUDO_TYPE_A:
      [inputParams.rd, inputParams.rs1] = destructuredInstruction.slice(1, 3);
      inputParams.imm = Number(destructuredInstruction[3]);
      break;
    case PSEUDO_TYPE_B:
      inputParams.imm = Number(destructuredInstruction[1]);
      break;
    case J_TYPE:
      inputParams.rd = destructuredInstruction[1];
      inputParams.imm = Number(destructuredInstruction[2]);
      break;
    default:
      console.log("Got an invalid instruction type.");
      break;
  }
  return inputParams;
}

function executeInstruction(destructuredInstruction: string[], decode: boolean = false): string {
  const instructionInfo: InstructionInfo = INSTRUCTION_TO_INFO.get(destructuredInstruction[0])!;
  const instructionFormat: OperandType[] = instructionInfo.instructionFormat;
  const inputParams: InstructionInput = fillInputParams(instructionFormat, destructuredInstruction);
  if (decode) {
    return instructionInfo.decodeFunction(inputParams);
  } else {
    instructionInfo.executionFunction(inputParams);
    return "";
  }
}

/*** Program Starting Point ***/
let instructionsList: string[][] = [];
let currentLineNumber: number = 0;

// Initialize registers with default values in binary
updateRegisterDisplays();

// adding event listeners which can change the representation
binaryCheck.addEventListener("click", () => {
  setRegisterBase(Base.BINARY);
  updateRegisterDisplays();
});
octalCheck.addEventListener("click", () => {
  setRegisterBase(Base.OCTAL);
  updateRegisterDisplays();
});
decimalCheck.addEventListener("click", () => {
  setRegisterBase(Base.DECIMAL);
  updateRegisterDisplays();
});
hexadecimalCheck.addEventListener("click", () => {
  setRegisterBase(Base.HEXADECIMAL);
  updateRegisterDisplays();
});

// Add click event listener to the assemble button
assembleButton?.addEventListener("click", () => {
  // Split the assembly editor's content into an array of instructions
  const inputInstructions: string[] = assemblyEditor?.value.split("\n") || [];

  // Call the assembleInput function to validate the instructions
  // and store the result in status (true = valid, false = invalid)
  const parsingResult: ParserResult = parseInput(inputInstructions);

  // If the assembly is invalid, log which line caused the error
  if (parsingResult.status == ParserStatus.ERR) {
    raiseError(parsingResult.errMessage);
  } else {
    clearError();
    setRegister("pc", zeroExtend("0"));
    instructionsList = parsingResult.output;
    currentLineNumber = 0;
  }

  for (let i = 0; i < instructionsList.length; i++) {
    memory.set(i, executeInstruction(instructionsList[i], true));
    
  }
});

stepButton?.addEventListener("click", () => {
  if (instructionsList.length == 0) {
    raiseError("Instructions have not yet been assembled.");
  } else {
    if (instructionsList[currentLineNumber]) {
      executeInstruction(instructionsList[currentLineNumber]);
      if (!["JAL", "JALR"].includes(instructionsList[currentLineNumber][0])) {
        setRegister("pc", binaryAdd(registers.get(STRINGS_TO_REGISTERS.get("pc")!)!, "100", zeroExtend));
      }
      currentLineNumber = parseInt(
        registers.get(STRINGS_TO_REGISTERS.get("pc")!)!,
        Base.BINARY,
      ) / 4;
    } else { 
      console.log("Program completed execution.");
    }
  }
});

resetRegistersButton?.addEventListener("click", () => {
  // reset all registers to 0
  for (let i: number = 0; i < XLEN + 1; i++) {
    registers.set(i, zeroExtend("0"));
  }
  updateRegisterDisplays();
});

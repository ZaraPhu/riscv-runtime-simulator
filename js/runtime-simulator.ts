/* The purpose of this file is to implement the RISC-V runtime simulator.
It will be used to simulate the execution of RISC-V instructions which are
retrieved from the assembly editor textarea. The simulator will execute the
instructions and update the state of the CPU accordingly.
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

/**
 * Processes and validates assembly instructions.
 *
 * This function examines each instruction in the provided list, splitting it into its
 * components (opcode, operands) and verifying the opcode and operands using helper functions.
 * If an illegal instruction or register is found, the function logs an error and records
 * which line contains the invalid instruction.
 *
 * @param instructionList - Array of assembly instruction strings to validate
 * @returns ParserResult object containing processed instructions, status, and error line numbers
 */
function assembleInput(instructionList: string[]): ParserResult {
  const parsingResult: ParserResult = {
    output: [],
    status: ParserStatus.OK,
    errOnLines: [],
  };

  // Iterate through each instruction in the provided list
  instructionList.forEach((instruction, instructionIndex) => {
    // Split the instruction into its components and remove commas
    const destructuredInstruction: string[] = instruction.split(" ").map(element => element.replace(",", ""));

    // Validate the instruction's opcode and register
    if (!verifyInstructionLegality(destructuredInstruction[0])) {
      console.log(`Illegal instruction ${destructuredInstruction[0]} found on line ${instructionIndex}`);
      parsingResult.status = ParserStatus.ERR;
      parsingResult.errOnLines.push(instructionIndex);
   } else if (!verifyRegisterLegality(destructuredInstruction[1])) {
      console.log(`Illegal register or immediate ${destructuredInstruction[1]} found on line ${instructionIndex}`);
      parsingResult.status = ParserStatus.ERR;
      parsingResult.errOnLines.push(instructionIndex);
    }

    // Add the processed instruction to the output regardless of validity
    parsingResult.output.push(destructuredInstruction);
  });
  return parsingResult;
}

/*** Program Starting Point ***/
// Add click event listener to the assemble button
assembleButton?.addEventListener("click", () => {
  // Split the assembly editor's content into an array of instructions
  const instructionsList: string[] = assemblyEditor?.value.split("\n") || [];

  // Call the assembleInput function to validate the instructions
  // and store the result in status (true = valid, false = invalid)
  const parsingResult: ParserResult = assembleInput(instructionsList);

  // If the assembly is invalid, log which line caused the error
  if (parsingResult.status == ParserStatus.ERR) {
    console.log(`Error at line(s) ${parsingResult.errOnLines}`);
  }

  // now the interpreter will read and execute the code line by line

});

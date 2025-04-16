"use strict";
/*
The purpose of this file is to implement the RISC-V runtime simulator.
It will be used to simulate the execution of RISC-V instructions which are
retrieved from the assembly editor textarea and update the state of the
execution environment.
Author: Zara Phukan.
Creation Date: April 3, 2025.
*/
/*** Constants and Variables ***/
const assemblyEditor = document.querySelector("#assembly-editor");
const assembleButton = document.querySelector("#assemble-button");
// custom object for returning the status from the parser
var ParserStatus;
(function (ParserStatus) {
    ParserStatus[ParserStatus["OK"] = 0] = "OK";
    ParserStatus[ParserStatus["ERR"] = 1] = "ERR";
})(ParserStatus || (ParserStatus = {}));
/*** Functions ***/
function assembleInput(instructionList) {
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
    const parsingResult = {
        output: [],
        status: ParserStatus.OK,
        errOnLines: [],
    };
    // Iterate through each instruction in the provided list
    instructionList.forEach((instruction, instructionIndex) => {
        // Split the instruction into its components and remove commas
        const destructuredInstruction = instruction.split(" ").map(element => element.replace(",", ""));
        if (destructuredInstruction.length == 0) {
            parsingResult.status = ParserStatus.ERR;
        }
        const format = INSTRUCTION_TO_FORMAT.get(destructuredInstruction[0]);
        if (!format) {
            parsingResult.status = ParserStatus.ERR;
        }
        const operands = destructuredInstruction.slice(1);
        if (!(operands.length == (format === null || format === void 0 ? void 0 : format.length))) {
            parsingResult.status = ParserStatus.ERR;
        }
        format === null || format === void 0 ? void 0 : format.forEach((expectedOperand, index) => {
            if (expectedOperand == OperandType.REGISTER) {
                if (!Array.from(STRINGS_TO_REGISTERS.keys()).includes(operands[index])) {
                    console.log(`Operand ${operands[index]} is not a valid register.`);
                    parsingResult.status = ParserStatus.ERR;
                }
            }
            else {
                // checks for immediate value inputs
                if (Number.isNaN(parseInt(operands[index]))) {
                    console.log(`Operand ${operands[index]} is not a valid immediate,`);
                    parsingResult.status = ParserStatus.ERR;
                }
            }
        });
        if (parsingResult.status == ParserStatus.ERR) {
            parsingResult.errOnLines.push(instructionIndex);
        }
        // Add the processed instruction to the output regardless of validity
        parsingResult.output.push(destructuredInstruction);
    });
    return parsingResult;
}
function executeInstructions() {
}
/*** Program Starting Point ***/
// Add click event listener to the assemble button
assembleButton === null || assembleButton === void 0 ? void 0 : assembleButton.addEventListener("click", () => {
    // Split the assembly editor's content into an array of instructions
    const instructionsList = (assemblyEditor === null || assemblyEditor === void 0 ? void 0 : assemblyEditor.value.split("\n")) || [];
    // Call the assembleInput function to validate the instructions
    // and store the result in status (true = valid, false = invalid)
    const parsingResult = assembleInput(instructionsList);
    // If the assembly is invalid, log which line caused the error
    if (parsingResult.status == ParserStatus.ERR) {
        console.log(`Error at line(s) ${parsingResult.errOnLines}`);
    }
});

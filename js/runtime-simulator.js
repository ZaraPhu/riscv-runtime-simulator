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
const errorText = document.querySelector("#error-text");
// custom object for returning the status from the parser
var ParserStatus;
(function (ParserStatus) {
    ParserStatus[ParserStatus["OK"] = 0] = "OK";
    ParserStatus[ParserStatus["ERR"] = 1] = "ERR";
})(ParserStatus || (ParserStatus = {}));
/*** Functions ***/
function raiseError(message) {
    if (errorText != null) {
        errorText.textContent = message;
    }
}
function parseInput(instructionList) {
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
    const parsingResult = {
        output: [],
        status: ParserStatus.OK,
        errOnLines: [],
    };
    // Iterate through each instruction in the provided list
    instructionList.forEach((instruction, instructionIndex) => {
        // Split the instruction into its components and remove commas
        const destructuredInstruction = instruction
            .split(" ")
            .map((element) => element.replace(",", ""));
        // If the instruction is empty (after splitting), mark as error
        if (destructuredInstruction.length == 0) {
            parsingResult.status = ParserStatus.ERR;
        }
        // Look up the expected format for this instruction using its opcode
        const format = INSTRUCTION_TO_FORMAT.get(destructuredInstruction[0]);
        // If the opcode isn't recognized, mark as error
        if (format == undefined) {
            console.log(`Instruction ${destructuredInstruction[0]} was not recognized.`);
            parsingResult.status = ParserStatus.ERR;
        }
        // Extract just the operands (everything after the opcode)
        const operands = destructuredInstruction.slice(1);
        // Check if the number of operands matches the expected format
        if (!(operands.length == (format === null || format === void 0 ? void 0 : format.length))) {
            console.log(`${operands.length} operands supplied but expected ${format === null || format === void 0 ? void 0 : format.length} operands.`);
            parsingResult.status = ParserStatus.ERR;
        }
        // Validate each operand based on its expected type
        format === null || format === void 0 ? void 0 : format.forEach((expectedOperand, index) => {
            if (expectedOperand == OperandType.REGISTER) {
                // For register operands, check if it's a valid register name
                if (!Array.from(STRINGS_TO_REGISTERS.keys()).includes(operands[index])) {
                    console.log(`Operand ${operands[index]} is not a valid register.`);
                    parsingResult.status = ParserStatus.ERR;
                }
            }
            else {
                // For immediate value operands, check if it's a valid number
                if (Number.isNaN(parseInt(operands[index]))) {
                    console.log(`Operand ${operands[index]} is not a valid immediate.`);
                    parsingResult.status = ParserStatus.ERR;
                }
            }
        });
        // If any errors were found in this instruction, record its line number
        if (parsingResult.status == ParserStatus.ERR) {
            parsingResult.errOnLines.push(instructionIndex);
        }
        // Add the processed instruction to the output regardless of validity
        parsingResult.output.push(destructuredInstruction);
    });
    return parsingResult;
}
function executeInstruction(destructuredInstruction) {
    const instructionType = INSTRUCTION_TO_FORMAT.get(destructuredInstruction[0]);
    switch (instructionType) {
        case I_TYPE:
            let iTypeCallable = I_INSTRUCTION_TO_FUNCTION.get(destructuredInstruction[0]);
            iTypeCallable(destructuredInstruction[1], destructuredInstruction[2], destructuredInstruction[3]);
            break;
        case R_TYPE:
            let rTypeCallable = R_INSTRUCTION_TO_FUNCTION.get(destructuredInstruction[0]);
            rTypeCallable(destructuredInstruction[1], destructuredInstruction[2], destructuredInstruction[3]);
            break;
        case U_TYPE:
            let uTypeCallable = U_INSTRUCTION_TO_FUNCTION.get(destructuredInstruction[0]);
            uTypeCallable(destructuredInstruction[1], destructuredInstruction[2]);
            break;
        case NONE_TYPE:
            let noneTypeCallable = NONE_INSTRUCTION_TO_FUNCTION.get(destructuredInstruction[0]);
            noneTypeCallable();
            break;
        default:
            console.log("Got an invalid instruction type.");
            break;
    }
    return true;
}
/*** Program Starting Point ***/
// Add click event listener to the assemble button
assembleButton === null || assembleButton === void 0 ? void 0 : assembleButton.addEventListener("click", () => {
    // Split the assembly editor's content into an array of instructions
    const instructionsList = (assemblyEditor === null || assemblyEditor === void 0 ? void 0 : assemblyEditor.value.split("\n")) || [];
    // Call the assembleInput function to validate the instructions
    // and store the result in status (true = valid, false = invalid)
    const parsingResult = parseInput(instructionsList);
    // If the assembly is invalid, log which line caused the error
    if (parsingResult.status == ParserStatus.ERR) {
        console.log(`Error at line(s) ${parsingResult.errOnLines}`);
    }
    else {
        parsingResult.output.forEach((destructuredInstruction) => {
            executeInstruction(destructuredInstruction);
        });
    }
});

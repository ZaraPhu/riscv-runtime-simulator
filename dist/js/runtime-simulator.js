"use strict";
const assemblyEditor = document.querySelector("#assembly-editor");
const assembleButton = document.querySelector("#assemble-button");
const errorText = document.querySelector("#error-text");
function raiseError(message) {
    if (errorText != null) {
        errorText.textContent = message;
    }
}
function parseInput(instructionList) {
    const parsingResult = {
        output: [],
        status: ParserStatus.OK,
        errMessage: "",
    };
    for (let i = 0; i < instructionList.length; i++) {
        const destructuredInstruction = instructionList[i]
            .split(" ")
            .map((element) => element.replace(",", ""));
        if (destructuredInstruction.length == 0) {
            parsingResult.status = ParserStatus.ERR;
            parsingResult.errMessage += `Line ${i + 1}: Empty instruction.\n`;
            continue;
        }
        const format = INSTRUCTION_TO_FORMAT.get(destructuredInstruction[0]);
        if (format == undefined) {
            parsingResult.status = ParserStatus.ERR;
            parsingResult.errMessage += `Line ${i + 1}: Instruction ${destructuredInstruction[0]} was not recognized.\n`;
            continue;
        }
        const operands = destructuredInstruction.slice(1);
        if (!(operands.length == (format === null || format === void 0 ? void 0 : format.length))) {
            parsingResult.status = ParserStatus.ERR;
            parsingResult.errMessage += `Line ${i + 1}: ${operands.length} operands supplied but expected ${format === null || format === void 0 ? void 0 : format.length} operands.\n`;
            continue;
        }
        for (let j = 0; j < format.length; j++) {
            const expectedOperand = format[j];
            if (expectedOperand == OperandType.REGISTER) {
                if (!Array.from(STRINGS_TO_REGISTERS.keys()).includes(operands[j])) {
                    parsingResult.status = ParserStatus.ERR;
                    parsingResult.errMessage += `Line ${i + 1}: Operand "${operands[j]}" is not a valid register.\n`;
                    continue;
                }
            }
            else {
                if (Number.isNaN(parseInt(operands[j]))) {
                    parsingResult.status = ParserStatus.ERR;
                    parsingResult.errMessage += `Line ${i + 1}: Operand "${operands[j]}" is not a number.\n`;
                    continue;
                }
                const operand_j = parseInt(operands[j]);
                if ((operand_j >= 4095) || (operand_j < -4096)) {
                }
            }
        }
        parsingResult.output.push(destructuredInstruction);
    }
    return parsingResult;
}
function executeInstruction(destructuredInstruction) {
    const instructionType = INSTRUCTION_TO_FORMAT.get(destructuredInstruction[0]);
    if (!instructionType) {
        raiseError(`Invalid instruction type for opcode ${destructuredInstruction[0]}`);
        return false;
    }
    let status = true;
    switch (instructionType) {
        case I_TYPE:
            const iTypeCallable = I_INSTRUCTION_TO_FUNCTION.get(destructuredInstruction[0]);
            status = iTypeCallable(destructuredInstruction[1], destructuredInstruction[2], destructuredInstruction[3]);
            break;
        case R_TYPE:
            const rTypeCallable = R_INSTRUCTION_TO_FUNCTION.get(destructuredInstruction[0]);
            status = rTypeCallable(destructuredInstruction[1], destructuredInstruction[2], destructuredInstruction[3]);
            break;
        case U_TYPE:
            let uTypeCallable = U_INSTRUCTION_TO_FUNCTION.get(destructuredInstruction[0]);
            status = uTypeCallable(destructuredInstruction[1], destructuredInstruction[2]);
            break;
        case NONE_TYPE:
            let noneTypeCallable = NONE_INSTRUCTION_TO_FUNCTION.get(destructuredInstruction[0]);
            status = noneTypeCallable();
            break;
        default:
            console.log("Got an invalid instruction type.");
            break;
    }
    return status;
}
updateRegisterDisplays();
binaryCheck.addEventListener("click", () => { setRegisterBase(Base.BINARY); updateRegisterDisplays(); });
octalCheck.addEventListener("click", () => { setRegisterBase(Base.OCTAL); updateRegisterDisplays(); });
decimalCheck.addEventListener("click", () => { setRegisterBase(Base.DECIMAL); updateRegisterDisplays(); });
hexadecimalCheck.addEventListener("click", () => { setRegisterBase(Base.HEXADECIMAL); updateRegisterDisplays(); });
assembleButton === null || assembleButton === void 0 ? void 0 : assembleButton.addEventListener("click", () => {
    const instructionsList = (assemblyEditor === null || assemblyEditor === void 0 ? void 0 : assemblyEditor.value.split("\n")) || [];
    const parsingResult = parseInput(instructionsList);
    if (parsingResult.status == ParserStatus.ERR) {
        raiseError(parsingResult.errMessage);
    }
    else {
        setRegister("pc", "0");
        const instructionList = parsingResult.output;
        let status = true;
        for (let i = 0; i < instructionList.length; i++) {
            status = executeInstruction(instructionList[i]);
            if (!status) {
                break;
            }
            else {
                addi("pc", "pc", 1);
            }
        }
    }
});
//# sourceMappingURL=runtime-simulator.js.map
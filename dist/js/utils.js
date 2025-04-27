"use strict";
const XLEN = 32;
var Base;
(function (Base) {
    Base[Base["BINARY"] = 2] = "BINARY";
    Base[Base["OCTAL"] = 8] = "OCTAL";
    Base[Base["DECIMAL"] = 10] = "DECIMAL";
    Base[Base["HEXADECIMAL"] = 16] = "HEXADECIMAL";
})(Base || (Base = {}));
let registerBase = Base.BINARY;
var OperandType;
(function (OperandType) {
    OperandType[OperandType["IMMEDIATE"] = 0] = "IMMEDIATE";
    OperandType[OperandType["REGISTER"] = 1] = "REGISTER";
})(OperandType || (OperandType = {}));
var ParserStatus;
(function (ParserStatus) {
    ParserStatus[ParserStatus["OK"] = 0] = "OK";
    ParserStatus[ParserStatus["ERR"] = 1] = "ERR";
})(ParserStatus || (ParserStatus = {}));
const I_TYPE = [
    OperandType.REGISTER,
    OperandType.REGISTER,
    OperandType.IMMEDIATE,
];
const U_TYPE = [
    OperandType.REGISTER,
    OperandType.IMMEDIATE,
];
const R_TYPE = [
    OperandType.REGISTER,
    OperandType.REGISTER,
    OperandType.REGISTER,
];
const NONE_TYPE = [];
const PSEUDO_TYPE = [
    OperandType.REGISTER,
    OperandType.REGISTER
];
const J_TYPE = [];
const registers = new Map(Array.from({ length: 33 }, (_, i) => [i, "0".padStart(XLEN, "0")]));
const STRINGS_TO_REGISTERS = new Map([
    ["x0", 0], ["x1", 1], ["x2", 2], ["x3", 3],
    ["x4", 4], ["x5", 5], ["x6", 6], ["x7", 7],
    ["x8", 8], ["x9", 9], ["x10", 10], ["x11", 11],
    ["x12", 12], ["x13", 13], ["x14", 14], ["x15", 15],
    ["x16", 16], ["x17", 17], ["x18", 18], ["x19", 19],
    ["x20", 20], ["x21", 21], ["x22", 22], ["x23", 23],
    ["x24", 24], ["x25", 25], ["x26", 26], ["x27", 27],
    ["x28", 28], ["x29", 29], ["x30", 30], ["x31", 31],
    ["pc", 32],
    ["zero", 0],
    ["ra", 1],
    ["sp", 2],
    ["gp", 3],
    ["tp", 4],
    ["t0", 5],
    ["t1", 6],
    ["t2", 7],
    ["fp", 8],
    ["s0", 8],
    ["s1", 9],
    ["a0", 10],
    ["a1", 11],
    ["a2", 12],
    ["a3", 13],
    ["a4", 14],
    ["a5", 15],
    ["a6", 16],
    ["a7", 17],
    ["s2", 18],
    ["s3", 19],
    ["s4", 20],
    ["s5", 21],
    ["s6", 22],
    ["s7", 23],
    ["s8", 24],
    ["s9", 25],
    ["s10", 26],
    ["s11", 27],
    ["t3", 28],
    ["t4", 29],
    ["t5", 30],
    ["t6", 31],
]);
const INSTRUCTION_TO_FORMAT = new Map([
    ["ADDI", I_TYPE],
    ["SLTI", I_TYPE],
    ["SLTIU", I_TYPE],
    ["ANDI", I_TYPE],
    ["ORI", I_TYPE],
    ["XORI", I_TYPE],
    ["SLLI", I_TYPE],
    ["SRLI", I_TYPE],
    ["SRAI", I_TYPE],
    ["LUI", U_TYPE],
    ["AUIPC", U_TYPE],
    ["ADD", R_TYPE],
    ["SUB", R_TYPE],
    ["SLT", R_TYPE],
    ["SLTU", R_TYPE],
    ["SLL", R_TYPE],
    ["SRL", R_TYPE],
    ["NOP", NONE_TYPE],
    ["MV", PSEUDO_TYPE],
    ["SEQZ", PSEUDO_TYPE],
    ["NOT", PSEUDO_TYPE],
    ["JAL", J_TYPE],
    ["JALR", J_TYPE],
]);
const I_INSTRUCTION_TO_FUNCTION = new Map([
    ["ADDI", addi],
    ["SLTI", slti],
    ["SLTIU", sltiu],
    ["ANDI", andi],
    ["ORI", ori],
    ["XORI", xori],
    ["SLLI", slli],
    ["SRLI", srli],
    ["SRAI", srai],
]);
const U_INSTRUCTION_TO_FUNCTION = new Map([
    ["LUI", lui],
    ["AUIPC", auipc],
]);
const R_INSTRUCTION_TO_FUNCTION = new Map([
    ["ADD", add],
    ["SUB", sub],
    ["SLT", slt],
    ["SLTU", sltu],
    ["SLL", sll],
    ["SRL", srl],
]);
const NONE_INSTRUCTION_TO_FUNCTION = new Map([
    ["NOP", () => { }],
]);
function binaryToHex(binVal) {
    let hexVal = "";
    for (let i = 0; i < binVal.length; i += 4) {
        hexVal += parseInt(binVal.substring(i, i + 4), 2).toString(Base.HEXADECIMAL);
    }
    return hexVal;
}
function binaryToOctal(binVal) {
    let octVal = "";
    const binValCleaned = binVal.padStart(Math.ceil(binVal.length / 3) * 3, "0");
    for (let i = 0; i < binVal.length; i += 3) {
        const octDigit = parseInt(binValCleaned.substring(i, i + 3), 2).toString(Base.OCTAL);
        octVal += octDigit;
    }
    return octVal;
}
function zeroExtend(bits) {
    return bits.padStart(XLEN, "0");
}
function signExtend(bits) {
    return bits.padStart(XLEN, bits.charAt(0));
}
function decimalToTwosComplement(val, numDigits) {
    if (val >= 0) {
        return val.toString(2).padStart(numDigits, "0");
    }
    const absVal = Math.abs(val);
    const bits = absVal.toString(2).padStart(numDigits, "0");
    let chars = [...bits];
    chars = chars.map((char) => (char === "0" ? "1" : "0"));
    for (let i = chars.length - 1; i >= 0; i--) {
        if (chars[i] === "1") {
            chars[i] = "0";
        }
        else {
            chars[i] = "1";
            break;
        }
    }
    return chars.join("").slice(-numDigits);
}
function twosComplementToDecimal(bits) {
    if (bits[0] === "1") {
        let invertedBits = bits.split("").map((bit) => (bit === "0" ? "1" : "0")).join("");
        const result = parseInt(invertedBits, 2) + 1;
        return -result;
    }
    else {
        return parseInt(bits, 2);
    }
}
function binaryAdd(op1, op2) {
    let carry = 0;
    let sum = "";
    const len = Math.max(op1.length, op2.length);
    op1 = op1.padStart(len, "0");
    op2 = op2.padStart(len, "0");
    for (let i = len - 1; i >= 0; i--) {
        let num1 = op1[i];
        let num2 = op2[i];
        let decSum = parseInt(num1) + parseInt(num2) + Number(carry);
        sum = (decSum % 2 == 0 ? "0" : "1") + sum;
        carry = decSum >= 2 ? 1 : 0;
    }
    return sum;
}
function setRegisterBase(base) {
    registerBase = [Base.BINARY, Base.OCTAL, Base.DECIMAL, Base.HEXADECIMAL].includes(base) ? base : Base.DECIMAL;
}
function updateRegisterDisplays() {
    registerDisplays.forEach((registerDisplay, i) => {
        if (registerBase == Base.BINARY) {
            registerDisplay.textContent = `0b${registers.get(i)}`;
        }
        else if (registerBase == Base.OCTAL) {
            registerDisplay.textContent = `0o${binaryToOctal(registers.get(i))}`;
        }
        else if (registerBase == Base.HEXADECIMAL) {
            registerDisplay.textContent = `0x${binaryToHex(registers.get(i))}`;
        }
        else {
            registerDisplay.textContent = `${twosComplementToDecimal(registers.get(i))}`;
        }
    });
}
function setRegister(rd, val) {
    const register = STRINGS_TO_REGISTERS.get(rd);
    let valCleaned = ((register == 0) ? "0" : val).slice(-XLEN).padStart(XLEN, "0");
    registers.set(register, valCleaned);
    updateRegisterDisplays();
    return true;
}
function addi(rd, rs1, imm) {
    const sourceValue = registers.get(STRINGS_TO_REGISTERS.get(rs1));
    const binarySum = binaryAdd(sourceValue, decimalToTwosComplement(imm, XLEN));
    return setRegister(rd, binarySum);
}
function slti(rd, rs1, imm) {
    const sourceValue = registers.get(STRINGS_TO_REGISTERS.get(rs1));
    return setRegister(rd, (twosComplementToDecimal(sourceValue) < imm) ? "1" : "0");
}
function sltiu(rd, rs1, imm) {
    const sourceValue = registers.get(STRINGS_TO_REGISTERS.get(rs1));
    const immUnsigned = twosComplementToDecimal(zeroExtend(decimalToTwosComplement(imm, 12)));
    return setRegister(rd, (twosComplementToDecimal(sourceValue) < immUnsigned) ? "1" : "0");
}
function andi(rd, rs1, imm) {
    const sourceBin = registers.get(STRINGS_TO_REGISTERS.get(rs1)).split("");
    const immBin = decimalToTwosComplement(imm, XLEN).split("");
    const result = [];
    for (let i = 0; i < XLEN; i++) {
        result[i] = (immBin[i] === "1") && (sourceBin[i] === "1") ? "1" : "0";
    }
    return setRegister(rd, result.join(""));
}
function ori(rd, rs1, imm) {
    const sourceBin = registers.get(STRINGS_TO_REGISTERS.get(rs1)).split("");
    const immBin = decimalToTwosComplement(imm, XLEN).split("");
    const result = [];
    for (let i = 0; i < XLEN; i++) {
        result[i] = (immBin[i] === "1") || (sourceBin[i] === "1") ? "1" : "0";
    }
    return setRegister(rd, result.join(""));
}
function xori(rd, rs1, imm) {
    const sourceBin = registers.get(STRINGS_TO_REGISTERS.get(rs1)).split("");
    const immBin = decimalToTwosComplement(imm, XLEN).split("");
    const result = [];
    for (let i = 0; i < XLEN; i++) {
        result[i] = !(immBin[i] === sourceBin[i]) ? "1" : "0";
    }
    return setRegister(rd, result.join(""));
}
function slli(rd, rs1, imm) {
    console.log("Called slli function.");
    return false;
}
function srli(rd, rs1, imm) {
    console.log("Called srli function.");
    return false;
}
function srai(rd, rs1, imm) {
    console.log("Called srai function.");
    return false;
}
function lui(rd, imm) {
    console.log("Called lui function.");
    return false;
}
function auipc(rd, imm) {
    console.log("Called auipc function.");
    return false;
}
function add(rd, rs1, rs2) {
    console.log("Called the add function.");
    return false;
}
function sub(rd, rs1, rs2) {
    console.log("Called the sub function.");
    return false;
}
function slt(rd, rs1, rs2) {
    console.log("Called the slt function.");
    return false;
}
function sltu(rd, rs1, rs2) {
    console.log("Called the sltu function.");
    return false;
}
function sll(rd, rs1, rs2) {
    console.log("Called the sll function.");
    return false;
}
function srl(rd, rs1, rs2) {
    console.log("Called the srl function.");
    return false;
}
//# sourceMappingURL=utils.js.map
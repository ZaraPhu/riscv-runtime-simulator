/*
This file is used to hold the helper functions for the runtime simulator script.
It also holds important constants which are used in the runtime simulator.
Author: Anjali Phukan.
Creation Date: April 15, 2025.
*/

/*****************************************************************************
 * RISC-V SIMULATOR CONSTANTS AND DEFINITIONS
 *****************************************************************************/

/**
 * Fundamental Architecture Constants
 */
// Define the RISC-V architecture bit width constant
const XLEN: number = 32; // XLEN=32 for RV32I instruction set architecture

/**
 * Enumerations and Types
 */
// Number base for register value representation
enum Base {
  BINARY = 2,
  OCTAL = 8,
  DECIMAL = 10,
  HEXADECIMAL = 16,
}

// Current base for displaying register values
let registerBase: number = Base.BINARY;

// Structure for parser results
enum ParserStatus { OK, ERR }
interface ParserResult {
  output: string[][];
  status: ParserStatus.OK | ParserStatus.ERR;
  errMessage: string;
}

interface InstructionInput { rd: string; rs1: string; rs2: string; imm: number; }

interface InstructionDecodeInfo {
  funct3: string | undefined;
  funct7: string | undefined;
  opcode: string;
}

enum OperandType { IMMEDIATE, REGISTER }
interface InstructionInfo {
  instructionFormat: OperandType[],
  executionFunction: Function,
  decodeFunction: Function,
  decodeInfo: InstructionDecodeInfo | undefined
}


/**
 * Instruction Format Definitions
 * Each format defines the expected operand types for different instruction categories
 */
const I_TYPE: OperandType[] = [OperandType.REGISTER, OperandType.REGISTER, OperandType.IMMEDIATE];
const U_TYPE: OperandType[] = [OperandType.REGISTER, OperandType.IMMEDIATE];
const R_TYPE: OperandType[] = [OperandType.REGISTER, OperandType.REGISTER, OperandType.REGISTER];
const NONE_TYPE: OperandType[] = [];
const PSEUDO_TYPE_A: OperandType[] = [OperandType.REGISTER, OperandType.REGISTER];
const PSEUDO_TYPE_B: OperandType[] = [OperandType.IMMEDIATE];
const PSEUDO_TYPE_C = U_TYPE;
const J_TYPE: OperandType[] = [OperandType.REGISTER, OperandType.IMMEDIATE];
const B_TYPE: OperandType[] = [OperandType.REGISTER, OperandType.REGISTER, OperandType.IMMEDIATE];
const S_TYPE: OperandType[] = I_TYPE;

/**
 * Register System
 */
// Storage for current register values (including program counter)
const registers: Map<number, string> = new Map(
  Array.from({ length: 33 }, (_, i) => [i, "0".repeat(XLEN)]),
);

/**
 * Memory System
 */
const memory: Map<number, string> = new Map(
  Array.from({ length: 256 }, (_, i) => [i, "0".repeat(XLEN)]),
);

/**
 * Register Name Mapping
 * Maps register names to their numeric identifiers
 * Includes both x-style names (x0-x31) and ABI names (zero, ra, sp, etc.)
 */
const STRINGS_TO_REGISTERS: ReadonlyMap<string, number> = new Map([
  // General Register Names (x0-x31)
  ["x0", 0],
  ["x1", 1],
  ["x2", 2],
  ["x3", 3],
  ["x4", 4],
  ["x5", 5],
  ["x6", 6],
  ["x7", 7],
  ["x8", 8],
  ["x9", 9],
  ["x10", 10],
  ["x11", 11],
  ["x12", 12],
  ["x13", 13],
  ["x14", 14],
  ["x15", 15],
  ["x16", 16],
  ["x17", 17],
  ["x18", 18],
  ["x19", 19],
  ["x20", 20],
  ["x21", 21],
  ["x22", 22],
  ["x23", 23],
  ["x24", 24],
  ["x25", 25],
  ["x26", 26],
  ["x27", 27],
  ["x28", 28],
  ["x29", 29],
  ["x30", 30],
  ["x31", 31],
  ["pc", 32], // Program Counter

  // ABI Register Names
  ["zero", 0], // Hard-wired zero
  ["ra", 1], // Return address
  ["sp", 2], // Stack pointer
  ["gp", 3], // Global pointer
  ["tp", 4], // Thread pointer
  ["t0", 5], // Temporary registers
  ["t1", 6],
  ["t2", 7],
  ["fp", 8], // Frame pointer (alias for s0)
  ["s0", 8], // Saved registers
  ["s1", 9],
  ["a0", 10], // Function argument/return registers
  ["a1", 11],
  ["a2", 12],
  ["a3", 13],
  ["a4", 14],
  ["a5", 15],
  ["a6", 16],
  ["a7", 17],
  ["s2", 18], // More saved registers
  ["s3", 19],
  ["s4", 20],
  ["s5", 21],
  ["s6", 22],
  ["s7", 23],
  ["s8", 24],
  ["s9", 25],
  ["s10", 26],
  ["s11", 27],
  ["t3", 28], // More temporary registers
  ["t4", 29],
  ["t5", 30],
  ["t6", 31],
]);

const INSTRUCTION_TO_INFO: ReadonlyMap<string, InstructionInfo> = new Map([
  ["ADDI", {
    instructionFormat: I_TYPE,
    executionFunction: addi,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "ADDI"); },
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "0010011" }
  }],
  ["MV", {
    instructionFormat: PSEUDO_TYPE_A,
    executionFunction: mv,
    decodeFunction: mv_decode,
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "0010011" }
  }],
  ["NOP", {
    instructionFormat: NONE_TYPE,
    executionFunction: nop,
    decodeFunction: nop_decode,
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "0010011" }
  }],
  ["SLTI", {
    instructionFormat: I_TYPE,
    executionFunction: slti,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "SLTI"); },
    decodeInfo: { funct3: "010", funct7: undefined, opcode: "0010011" }
  }],
  ["SLTIU", {
    instructionFormat: I_TYPE,
    executionFunction: sltiu,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "SLTIU"); },
    decodeInfo: { funct3: "011", funct7: undefined, opcode: "0010011" }
  }],
  ["SEQZ", {
    instructionFormat: PSEUDO_TYPE_A,
    executionFunction: seqz,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "SEQZ"); },
    decodeInfo: { funct3: "011", funct7: undefined, opcode: "0010011" }
  }],
  ["ANDI", {
    instructionFormat: I_TYPE,
    executionFunction: andi,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "ANDI"); },
    decodeInfo: { funct3: "111", funct7: undefined, opcode: "0010011" }
  }],
  ["ORI", {
    instructionFormat: I_TYPE,
    executionFunction: ori,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "ORI"); },
    decodeInfo: { funct3: "110", funct7: undefined, opcode: "0010011" }
  }],
  ["XORI", {
    instructionFormat: I_TYPE,
    executionFunction: xori,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "XORI"); },
    decodeInfo: { funct3: "100", funct7: undefined, opcode: "0010011" }
  }],
  ["NOT", {
    instructionFormat: PSEUDO_TYPE_A,
    executionFunction: not,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "NOT") },
    decodeInfo: { funct3: "100", funct7: undefined, opcode: "0010011" }
  }],
  ["SLLI", {
    instructionFormat: I_TYPE,
    executionFunction: slli,
    decodeFunction: slli_decode,
    decodeInfo: { funct3: "001", funct7: undefined, opcode: "0010011" }
  }],
  ["SRLI", {
    instructionFormat: I_TYPE,
    executionFunction: srli,
    decodeFunction: srli_decode,
    decodeInfo: { funct3: "101", funct7: undefined, opcode: "0010011" }
  }],
  ["SRAI", {
    instructionFormat: I_TYPE,
    executionFunction: srai,
    decodeFunction: srai_decode,
    decodeInfo: { funct3: "101", funct7: undefined, opcode: "0010011" }
  }],
  ["LUI", {
    instructionFormat: U_TYPE,
    executionFunction: lui,
    decodeFunction: (inputParams: InstructionInput) => { return uTypeDecode(inputParams, "LUI"); },
    decodeInfo: { funct3: undefined, funct7: undefined, opcode: "0110111" }
  }],
  ["AUIPC", {
    instructionFormat: U_TYPE,
    executionFunction: auipc,
    decodeFunction: (inputParams: InstructionInput) => { return uTypeDecode(inputParams, "AUIPC"); },
    decodeInfo: { funct3: undefined, funct7: undefined, opcode: "0010111" }
  }],
  ["ADD", {
    instructionFormat: R_TYPE,
    executionFunction: add,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "ADD"); },
    decodeInfo: { funct3: "000", funct7: "0000000", opcode: "0110011" }
  }],
  ["SUB", {
    instructionFormat: R_TYPE,
    executionFunction: sub,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SUB"); },
    decodeInfo: { funct3: "000", funct7: "0100000", opcode: "0110011" }
  }],
  ["SLT", {
    instructionFormat: R_TYPE,
    executionFunction: slt,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SLT"); },
    decodeInfo: { funct3: "010", funct7: "0000000", opcode: "0110011" }
  }],
  ["SLTZ", {
    instructionFormat: PSEUDO_TYPE_A,
    executionFunction: sltz,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SLTZ"); },
    decodeInfo: { funct3: "010", funct7: "0000000", opcode: "0110011" }
  }],
  ["SGTZ", {
    instructionFormat: PSEUDO_TYPE_A,
    executionFunction: sgtz,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SGTZ"); },
    decodeInfo: { funct3: "010", funct7: "0000000", opcode: "0110011" }
  }],
  ["SLTU", {
    instructionFormat: R_TYPE,
    executionFunction: sltu,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SLTU"); },
    decodeInfo: { funct3: "011", funct7: "0000000", opcode: "0110011" }
  }],
  ["SNEZ", {
    instructionFormat: PSEUDO_TYPE_A,
    executionFunction: snez,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SNEZ"); },
    decodeInfo: { funct3: "011", funct7: "0000000", opcode: "0110011" }
  }],
  ["AND", {
    instructionFormat: R_TYPE,
    executionFunction: and,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "AND"); },
    decodeInfo: { funct3: "111", funct7: "0000000", opcode: "0110011" }
  }],
  ["OR", {
    instructionFormat: R_TYPE,
    executionFunction: or,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "OR"); },
    decodeInfo: { funct3: "110", funct7: "0000000", opcode: "0110011" }
  }],
  ["XOR", {
    instructionFormat: R_TYPE,
    executionFunction: xor,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "XOR"); },
    decodeInfo: { funct3: "100", funct7: "0000000", opcode: "0110011" }
  }],
  ["SLL", {
    instructionFormat: R_TYPE,
    executionFunction: sll,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SLL"); },
    decodeInfo: { funct3: "001", funct7: "0000000", opcode: "0110011" }
  }],
  ["SRL", {
    instructionFormat: R_TYPE,
    executionFunction: srl,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SRL"); },
    decodeInfo: { funct3: "101", funct7: "0000000", opcode: "0110011" }
  }],
  ["SRA", {
    instructionFormat: R_TYPE,
    executionFunction: sra,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SRA"); },
    decodeInfo: { funct3: "101", funct7: "0100000", opcode: "0110011" }
  }],
  ["JAL", {
    instructionFormat: J_TYPE,
    executionFunction: jal,
    decodeFunction: jal_decode,
    decodeInfo: { funct3: undefined, funct7: undefined, opcode: "1101111" }
  }],
  ["J", {
    instructionFormat: PSEUDO_TYPE_B,
    executionFunction: j,
    decodeFunction: j_decode,
    decodeInfo: { funct3: undefined, funct7: undefined, opcode: "1101111" }
  }],
  ["JALR", {
    instructionFormat: I_TYPE,
    executionFunction: jalr,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "JALR"); },
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "1100111" }
  }],
  ["BEQ", {
    instructionFormat: B_TYPE,
    executionFunction: beq,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BEQ"); },
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "1100011" }
  }],
  ["BEQZ", {
    instructionFormat: PSEUDO_TYPE_C,
    executionFunction: beqz,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BEQZ"); },
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "1100011" }
  }],
  ["BNE", {
    instructionFormat: B_TYPE,
    executionFunction: bne,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BNE"); },
    decodeInfo: { funct3: "001", funct7: undefined, opcode: "1100011" }
  }],
  ["BNEZ", {
    instructionFormat: PSEUDO_TYPE_C,
    executionFunction: bnez,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BNEZ"); },
    decodeInfo: { funct3: "001", funct7: undefined, opcode: "1100011" }
  }],
  ["BLT", {
    instructionFormat: B_TYPE,
    executionFunction: blt,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BLT"); },
    decodeInfo: { funct3: "100", funct7: undefined, opcode: "1100011" }
  }],
  ["BGT", {
    instructionFormat: B_TYPE,
    executionFunction: bgt,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BGT"); },
    decodeInfo: { funct3: "100", funct7: undefined, opcode: "1100011" }
  }],
  ["BLTZ", {
    instructionFormat: PSEUDO_TYPE_C,
    executionFunction: bltz,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BLTZ"); },
    decodeInfo: { funct3: "100", funct7: undefined, opcode: "1100011" }
  }],
  ["BGTZ", {
    instructionFormat: PSEUDO_TYPE_C,
    executionFunction: bgtz,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BGTZ"); },
    decodeInfo: { funct3: "100", funct7: undefined, opcode: "1100011" }
  }],
  ["BLTU", {
    instructionFormat: B_TYPE,
    executionFunction: bltu,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BLTU"); },
    decodeInfo: { funct3: "101", funct7: undefined, opcode: "1100011" }
  }],
  ["BGTU", {
    instructionFormat: B_TYPE,
    executionFunction: bgtu,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BGTU"); },
    decodeInfo: { funct3: "101", funct7: undefined, opcode: "1100011" }
  }],
  ["BGE", {
    instructionFormat: B_TYPE,
    executionFunction: bge,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BGE"); },
    decodeInfo: { funct3: "110", funct7: undefined, opcode: "1100011" }
  }],
  ["BLE", {
    instructionFormat: B_TYPE,
    executionFunction: ble,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BLE"); },
    decodeInfo: { funct3: "110", funct7: undefined, opcode: "1100011" }
  }],
  ["BLEZ", {
    instructionFormat: PSEUDO_TYPE_C,
    executionFunction: blez,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BLEZ"); },
    decodeInfo: { funct3: "110", funct7: undefined, opcode: "1100011" }
  }],
  ["BGEZ", {
    instructionFormat: PSEUDO_TYPE_C,
    executionFunction: bgez,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BGEZ"); },
    decodeInfo: { funct3: "110", funct7: undefined, opcode: "1100011" }
  }],
  ["BGEU", {
    instructionFormat: B_TYPE,
    executionFunction: bgeu,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BGEU"); },
    decodeInfo: { funct3: "111", funct7: undefined, opcode: "1100011" }
  }],
  ["BLEU", {
    instructionFormat: B_TYPE,
    executionFunction: bleu,
    decodeFunction: (inputParams: InstructionInput) => { return bTypeDecode(inputParams, "BLEU"); },
    decodeInfo: { funct3: "111", funct7: undefined, opcode: "1100011" }
  }],
  ["LW", {
    instructionFormat: I_TYPE,
    executionFunction: lw,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "LW"); },
    decodeInfo: { funct3: "010", funct7: undefined, opcode: "0000011" }
  }],
  ["LH", {
    instructionFormat: I_TYPE,
    executionFunction: lh,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "LH"); },
    decodeInfo: { funct3: "001", funct7: undefined, opcode: "0000011" }
  }],
  ["LHU", {
    instructionFormat: I_TYPE,
    executionFunction: lhu,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "LHU"); },
    decodeInfo: { funct3: "101", funct7: undefined, opcode: "0000011" }
  }],
  ["LB", {
    instructionFormat: I_TYPE,
    executionFunction: lb,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "LB"); },
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "0000011" }
  }],
  ["LBU", {
    instructionFormat: I_TYPE,
    executionFunction: lbu,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "LBU"); },
    decodeInfo: { funct3: "111", funct7: undefined, opcode: "0000011" }
  }],
  ["SW", {
    instructionFormat: S_TYPE,
    executionFunction: sw,
    decodeFunction: (inputParams: InstructionInput) => { return sTypeDecode(inputParams, "SW"); },
    decodeInfo: { funct3: "010", funct7: undefined, opcode: "0100011" },
  }],
  ["SH", {
    instructionFormat: S_TYPE,
    executionFunction: sh,
    decodeFunction: (inputParams: InstructionInput) => { return sTypeDecode(inputParams, "SH"); },
    decodeInfo: { funct3: "001", funct7: undefined, opcode: "0100011" },
  }],
  ["SB", {
    instructionFormat: S_TYPE,
    executionFunction: sb,
    decodeFunction: (inputParams: InstructionInput) => { return sTypeDecode(inputParams, "SB"); },
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "0100011" },
  }]
]);

const PC_MOD_INSTRUCTIONS: string[] = [
  "J", "JAL", "JALR", ""
]

/*** General Functions ***/

function binaryToHex(binVal: string): string {
  let hexVal = "";
  const binValCleaned: string = zeroExtend(
    binVal,
    Math.ceil(binVal.length / 4) * 4,
  );
  for (let i = 0; i < binValCleaned.length; i += 4) {
    hexVal += parseInt(binValCleaned.substring(i, i + 4), 2).toString(
      Base.HEXADECIMAL
    );
  }
  return hexVal;
}

function binaryToOctal(binVal: string): string {
  let octVal = "";
  const binValCleaned: string = zeroExtend(
    binVal,
    Math.ceil(binVal.length / 3) * 3,
  );
  for (let i = 0; i < binValCleaned.length; i += 3) {
    const octDigit = parseInt(binValCleaned.substring(i, i + 3), 2).toString(
      Base.OCTAL,
    );
    octVal += octDigit;
  }
  return octVal;
}

function setRegisterBase(base: number) {
  registerBase = [
    Base.BINARY,
    Base.OCTAL,
    Base.DECIMAL,
    Base.HEXADECIMAL,
  ].includes(base)
    ? base
    : Base.DECIMAL;
}

function updateRegisterDisplays() {
  registerDisplays.forEach((registerDisplay, i) => {
    if (registerBase == Base.BINARY) {
      registerDisplay.textContent = `0b${registers.get(i)!}`;
    } else if (registerBase == Base.OCTAL) {
      registerDisplay.textContent = `0o${binaryToOctal(registers.get(i)!)}`;
    } else if (registerBase == Base.HEXADECIMAL) {
      registerDisplay.textContent = `0x${binaryToHex(registers.get(i)!)}`;
    } else {
      registerDisplay.textContent = `${twosComplementToDecimal(registers.get(i)!)}`;
    }
  });
}

function setRegister(
  rd: string,
  val: string,
  extendFunc: Function = signExtend,
): void {
  const register: number = STRINGS_TO_REGISTERS.get(rd)!;
  let valCleaned: string = (register == 0) ? "0" : val;
  if (valCleaned.length != 32) {
    valCleaned = extendFunc(valCleaned);
  }
  registers.set(register, valCleaned);
  updateRegisterDisplays();
}

function zeroExtend(bits: string, len: number = XLEN): string {
  return bits.padStart(len, "0");
}

function signExtend(bits: string, len: number = XLEN): string {
  return bits.padStart(len, bits.charAt(0));
}

function getValueInRegister(reg: string): string | undefined {
  return Array.from(STRINGS_TO_REGISTERS.keys()).includes(reg)
    ? registers.get(STRINGS_TO_REGISTERS.get(reg)!)! : undefined;
}

function registerPositionInBinary(reg: string): string | undefined {
  return Array.from(STRINGS_TO_REGISTERS.keys()).includes(reg)
    ? zeroExtend(STRINGS_TO_REGISTERS.get(reg)!.toString(Base.BINARY), 5) : undefined;
}

function decimalToTwosComplement(
  val: number,
  numDigits: number = XLEN,
): string {
  if (val >= 0) { return zeroExtend(val.toString(Base.BINARY)); }
  const absVal: number = Math.abs(val);
  const bits: string = zeroExtend(absVal.toString(Base.BINARY));
  let chars: string[] = [...bits];
  chars = chars.map((char) => (char === "0" ? "1" : "0"));
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] === "1") {
      chars[i] = "0";
    } else {
      chars[i] = "1";
      break;
    }
  }
  return chars.join("").slice(-numDigits);
}

function twosComplementToDecimal(bits: string): number {
  if (bits[0] === "1") {
    let invertedBits: string = bits
      .split("")
      .map((bit) => (bit === "0" ? "1" : "0"))
      .join(""); // flip all the bits
    const result: number = parseInt(invertedBits, Base.BINARY) + 1; // parse as an integer
    return -result;
  } else {
    return parseInt(bits, Base.BINARY);
  }
}

function binaryAdd(
  op1: string,
  op2: string,
  extendFunc: Function = signExtend,
): string {
  let [carry, sum, len] = [0, "", Math.max(op1.length, op2.length)];
  const [cleanedOp1, cleanedOp2] = [extendFunc(op1, len), extendFunc(op2, len)];
  for (let i = len - 1; i >= 0; i--) {
    let [num1, num2] = [cleanedOp1.charAt(i), cleanedOp2.charAt(i)];
    let decSum: number = parseInt(num1) + parseInt(num2) + Number(carry);
    sum = (decSum % 2 == 0 ? "0" : "1") + sum;
    carry = decSum >= 2 ? 1 : 0;
  }
  return sum;
}

function binarySub(
  op1: string,
  op2: string,
  extendFunc: Function = signExtend,
): string {
  const len: number = Math.max(op1.length, op2.length);
  const cleanedOp2: string = extendFunc(op2, len);
  const op2Minus: string[] = binaryAdd(cleanedOp2, "1", signExtend).split("");
  let negOp2: string[] = [];
  for (let i = len - 1; i >= 0; i--) {
    negOp2[i] = (op2Minus[i] == "0") ? "1" : "0";
  }
  return binaryAdd(op1, negOp2.join(""));
}

/*** Instruction Decoding Functions ***/

function iTypeDecode(inputParams: InstructionInput, instructionName: string): string {
  const decodeInfo: InstructionDecodeInfo = INSTRUCTION_TO_INFO.get(instructionName)!.decodeInfo!;
  return (
    decimalToTwosComplement(Number(inputParams.imm)).slice(-12) // imm
    + registerPositionInBinary(inputParams.rs1)! //rs
    + decodeInfo.funct3! // funct3
    + registerPositionInBinary(inputParams.rd)! // rd
    + decodeInfo.opcode!  // opcode
  );
}

function mv_decode(inputParams: InstructionInput): string {
  inputParams.imm = 0;
  return iTypeDecode(inputParams, "ADDI");
}

function nop_decode(inputParams: InstructionInput): string {
  inputParams.rd = "x0";
  inputParams.rs1 = "x0";
  inputParams.imm = 0;
  return iTypeDecode(inputParams, "NOP");
}

function slli_decode(inputParams: InstructionInput): string {
  const instructionInfo: InstructionInfo = INSTRUCTION_TO_INFO.get("SLLI")!;
  return (
    "0".repeat(7)
    + decimalToTwosComplement(Number(inputParams.imm)).slice(-5) // imm
    + registerPositionInBinary(inputParams.rs1)! //rs
    + instructionInfo.decodeInfo!.funct3! // funct3
    + registerPositionInBinary(inputParams.rd)! // rd
    + instructionInfo.decodeInfo!.opcode!  // opcode
  );
}

function srli_decode(inputParams: InstructionInput): string {
  const instructionInfo: InstructionInfo = INSTRUCTION_TO_INFO.get("SRLI")!;
  return (
    "0".repeat(7)
    + decimalToTwosComplement(Number(inputParams.imm)).slice(-5) // imm
    + registerPositionInBinary(inputParams.rs1)! //rs
    + instructionInfo.decodeInfo!.funct3! // funct3
    + registerPositionInBinary(inputParams.rd)! // rd
    + instructionInfo.decodeInfo!.opcode!  // opcode
  );
}

function srai_decode(inputParams: InstructionInput): string {
  const instructionInfo: InstructionInfo = INSTRUCTION_TO_INFO.get("SRLI")!;
  return (
    "01" + "0".repeat(5)
    + decimalToTwosComplement(Number(inputParams.imm)).slice(-5) // imm
    + registerPositionInBinary(inputParams.rs1)! //rs
    + instructionInfo.decodeInfo!.funct3! // funct3
    + registerPositionInBinary(inputParams.rd)! // rd
    + instructionInfo.decodeInfo!.opcode!  // opcode
  );
}

function uTypeDecode(inputParams: InstructionInput, instructionName: string) {
  return (
    decimalToTwosComplement(Number(inputParams.imm)).slice(0, 20)
    + registerPositionInBinary(inputParams.rd)!
    + INSTRUCTION_TO_INFO.get(instructionName)!.decodeInfo!.opcode
  );
}

function rTypeDecode(inputParams: InstructionInput, instructionName: string): string {
  const decodeInfo: InstructionDecodeInfo = INSTRUCTION_TO_INFO.get(instructionName)!.decodeInfo!;
  return (
    decodeInfo.funct7
    + registerPositionInBinary(inputParams.rs2)!
    + registerPositionInBinary(inputParams.rs1)!
    + decodeInfo.funct3
    + registerPositionInBinary(inputParams.rd)!
    + decodeInfo.opcode
  );
}

function jal_decode(inputParams: InstructionInput): string {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-20);
  const decodeInfo: InstructionDecodeInfo =
    INSTRUCTION_TO_INFO.get("JAL")!.decodeInfo!;
  return (
    immBin.charAt(19)
    + immBin.slice(0, 9)
    + immBin.charAt(10)
    + immBin.slice(11, 18)
    + getValueInRegister(inputParams.rd)!
    + decodeInfo.opcode
  );
}

function j_decode(inputParams: InstructionInput): string {
  inputParams.rd = "x0";
  return jal_decode(inputParams);
}

function bTypeDecode(inputParams: InstructionInput, instructionName: string): string {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  const decodeInfo: InstructionDecodeInfo = INSTRUCTION_TO_INFO.get(instructionName)!.decodeInfo!;
  return (
    immBin.charAt(0)
    + immBin.slice(2, 7)
    + registerPositionInBinary(inputParams.rs2)!
    + registerPositionInBinary(inputParams.rs1)!
    + decodeInfo.funct3!
    + immBin.slice(7, 11)
    + immBin.charAt(1)
    + decodeInfo.opcode
  );
}

function sTypeDecode(inputParams: InstructionInput, instructionName: string): string {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  const decodeInfo: InstructionDecodeInfo = INSTRUCTION_TO_INFO.get(instructionName)!.decodeInfo!;
  return (
    immBin.slice(0, 7)
    + registerPositionInBinary(inputParams.rs2)!
    + registerPositionInBinary(inputParams.rs1)!
    + decodeInfo.funct3!
    + immBin.slice(7)
    + decodeInfo.opcode!
  );
}

/*** Instruction Execution Functions ***/

function addi(inputParams: InstructionInput): void {
  const binarySum: string = binaryAdd(
    decimalToTwosComplement(inputParams.imm).slice(-12),
    getValueInRegister(inputParams.rs1)!,
    signExtend
  );
  setRegister(inputParams.rd, binarySum);
}

function mv(inputParams: InstructionInput): void {
  inputParams.imm = 0;
  addi(inputParams);
}

function nop(inputParams: InstructionInput): void {
  inputParams.rd = "x0";
  inputParams.rs1 = "x0";
  inputParams.imm = 0;
  addi(inputParams);
}

function slti(inputParams: InstructionInput): void {
  const isLessThan: boolean = (
    twosComplementToDecimal(getValueInRegister(inputParams.rs1)!)
    < twosComplementToDecimal(decimalToTwosComplement(inputParams.imm).slice(-12))
  );
  setRegister(inputParams.rd, isLessThan ? "1" : "0", zeroExtend);
}

function sltiu(inputParams: InstructionInput): void {
  const isLessThanUnsigned: boolean = (
    parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY)
    < parseInt(decimalToTwosComplement(inputParams.imm).slice(-12), Base.BINARY)
  );
  setRegister(inputParams.rd, isLessThanUnsigned ? "1" : "0", zeroExtend);
}

function seqz(inputParams: InstructionInput): void {
  inputParams.imm = 1;
  sltiu(inputParams);
}

function andi(inputParams: InstructionInput): void {
  const immBits: string[] = decimalToTwosComplement(Number(inputParams.imm)).slice(-12).split("");
  const sourceBits: string[] = getValueInRegister(inputParams.rs1)!.split("");
  const resultBits: string[] = [];
  for (let i: number = 0; i < XLEN; i++) {
    resultBits[i] = ((immBits[i] === "1") && (sourceBits[i] === "1")) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function ori(inputParams: InstructionInput): void {
  const immBits: string[] =
    decimalToTwosComplement(Number(inputParams.imm))
      .slice(-12)
      .split("");
  const sourceBits: string[] = getValueInRegister(inputParams.rs1)!.split("");
  const resultBits: string[] = [];
  for (let i: number = 0; i < XLEN; i++) {
    resultBits[i] = ((immBits[i] === "1") || (sourceBits[i] === "1")) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function xori(inputParams: InstructionInput): void {
  const immBits: string[] = decimalToTwosComplement(inputParams.imm, 12).split("");
  const sourceBits: string[] = getValueInRegister(inputParams.rs1)!.split("");
  const resultBits: string[] = [];
  for (let i: number = 0; i < XLEN; i++) {
    resultBits[i] = !(immBits[i] === sourceBits[i]) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function not(inputParams: InstructionInput): void {
  inputParams.imm = -1;
  xori(inputParams);
}

function slli(inputParams: InstructionInput): void {
  const immBits: string = decimalToTwosComplement(Number(inputParams.imm)).slice(-5);
  const result: string = (
    getValueInRegister(inputParams.rs1)!
    + "0".repeat(parseInt(immBits, Base.BINARY))
  ).slice(-XLEN);
  setRegister(inputParams.rd, result);
}

function srli(inputParams: InstructionInput): void {
  const immBits: string = decimalToTwosComplement(Number(inputParams.imm)).slice(-5);
  const result: string = (
    "0".repeat(parseInt(immBits, Base.BINARY))
    + registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!
  ).slice(0, XLEN);
  setRegister(inputParams.rd, result);
}

function srai(inputParams: InstructionInput): void {
  const immVal: number = parseInt(inputParams.imm.toString(Base.BINARY).slice(-5), Base.BINARY);
  const sourceBits: string = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!;
  let result: string = "";
  if (sourceBits[0] === "0") {
    result = ("1".repeat(immVal) + sourceBits).slice(0, XLEN);
  } else {
    result = ("0".repeat(immVal) + sourceBits).slice(0, XLEN);
  }
  setRegister(inputParams.rd, result);
}

function lui(inputParams: InstructionInput): void {
  setRegister(
    inputParams.rd,
    decimalToTwosComplement(Number(inputParams.imm)).slice(0, 20) + "0".repeat(12)
  );
}

function auipc(inputParams: InstructionInput): void {
  setRegister(
    inputParams.rd,
    binaryAdd(
      decimalToTwosComplement(Number(inputParams.imm)).slice(0, 20) + "0".repeat(12),
      getValueInRegister("pc")!
    )
  );
}

function add(inputParams: InstructionInput): void {
  const sumValue: string = binaryAdd(
    getValueInRegister(inputParams.rs1)!,
    getValueInRegister(inputParams.rs2)!
  );
  setRegister(inputParams.rd, sumValue);
}

function sub(inputParams: InstructionInput): void {
  const subValue: string = binarySub(
    getValueInRegister(inputParams.rs1)!,
    getValueInRegister(inputParams.rs2)!
  );
  setRegister(inputParams.rd, subValue);
}

function slt(inputParams: InstructionInput): void {
  const isLessThan: boolean = (
    twosComplementToDecimal(getValueInRegister(inputParams.rs1)!)
    < twosComplementToDecimal(getValueInRegister(inputParams.rs2)!)
  );
  setRegister(inputParams.rd, isLessThan ? "1" : "0", zeroExtend);
}

function sltz(inputParams: InstructionInput): void {
  inputParams.rs2 = "x0";
  slt(inputParams);
}

function sgtz(inputParams: InstructionInput): void {
  inputParams.rs2 = inputParams.rs1;
  inputParams.rs1 = "x0";
  slt(inputParams);
}

function sltu(inputParams: InstructionInput): void {
  const isLessThanUnsigned: boolean = (
    parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY)
    < parseInt(getValueInRegister(inputParams.rs2)!, Base.BINARY)
  );
  setRegister(inputParams.rd, isLessThanUnsigned ? "1" : "0", zeroExtend);
}

function snez(inputParams: InstructionInput): void {
  inputParams.rs2 = inputParams.rs1;
  inputParams.rs1 = "x0";
  sltu(inputParams);
}

function and(inputParams: InstructionInput): void {
  const source1Bits: string[] = getValueInRegister(inputParams.rs1)!.split("");
  const source2Bits: string[] = getValueInRegister(inputParams.rs2)!.split("");
  const resultBits: string[] = [];
  for (let i = 0; i < XLEN; i++) {
    resultBits[i] = ((source1Bits[i] == "1") && (source2Bits[i] == "1")) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function or(inputParams: InstructionInput): void {
  const source1Bits: string[] = getValueInRegister(inputParams.rs1)!.split("");
  const source2Bits: string[] = getValueInRegister(inputParams.rs2)!.split("");
  const resultBits: string[] = [];
  for (let i = 0; i < XLEN; i++) {
    resultBits[i] = ((source1Bits[i] === "1") || (source2Bits[i] === "1")) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function xor(inputParams: InstructionInput): void {
  const source1Bits: string[] = getValueInRegister(inputParams.rs1)!.split("");
  const source2Bits: string[] = getValueInRegister(inputParams.rs2)!.split("");
  const resultBits: string[] = [];
  for (let i = 0; i < XLEN; i++) {
    resultBits[i] = !(source1Bits[i] === source2Bits[i]) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function sll(inputParams: InstructionInput): void {
  const rs2TruncatedVal: number = parseInt(
    getValueInRegister(inputParams.rs2)!.slice(-5),
    Base.BINARY
  );
  setRegister(
    inputParams.rd,
    (getValueInRegister(inputParams.rs1)! + zeroExtend("0", rs2TruncatedVal)).slice(-XLEN),
  );
}

function srl(inputParams: InstructionInput): void {
  const rs2TruncatedVal: number = parseInt(
    getValueInRegister(inputParams.rs2)!.slice(-5),
    Base.BINARY,
  );
  setRegister(
    inputParams.rd,
    (zeroExtend("0", rs2TruncatedVal) + getValueInRegister(inputParams.rs1)!).substring(0, XLEN),
  );
}

function sra(inputParams: InstructionInput): void {
  const rs2TruncatedVal: number = parseInt(
    getValueInRegister(inputParams.rs2)!.slice(-5),
    Base.BINARY,
  );
  if (inputParams.rs1[0].localeCompare("0") == 0) {
    setRegister(
      inputParams.rd,
      (zeroExtend("0", rs2TruncatedVal) + getValueInRegister(inputParams.rs1)!).substring(0, XLEN),
    );
  } else {
    setRegister(
      inputParams.rd,
      (zeroExtend("1", rs2TruncatedVal) + getValueInRegister(inputParams.rs1)!).substring(0, XLEN),
    );
  }
}

function jal(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-20);
  setRegister(
    inputParams.rd,
    binaryAdd(
      getValueInRegister("pc")!,
      "100",
      zeroExtend,
    ),
  );
  setRegister(
    "pc",
    binaryAdd(
      getValueInRegister("pc")!,
      binaryAdd(immBin, immBin)
    ),
  );
}

function j(inputParams: InstructionInput): void {
  inputParams.rd = "x0";
  jal(inputParams);
}


function jalr(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  const result: string[] = binaryAdd(
    immBin,
    getValueInRegister(inputParams.rs1)!,
  ).split("");
  result[-1] = "0";
  setRegister(
    "pc",
    binaryAdd(getValueInRegister("pc")!, result.join("")),
  );
  setRegister(
    inputParams.rd,
    binaryAdd(
      getValueInRegister("pc")!,
      "100",
      zeroExtend,
    ),
  );
}

function beq(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm, 12);
  if (
    getValueInRegister(inputParams.rs1)!
    === getValueInRegister(inputParams.rs2)!
  ) {
    setRegister(
      "pc",
      binaryAdd(
        getValueInRegister("pc")!,
        binaryAdd(immBin, immBin) // jump in signed offest of 2 bytes
      )
    );
  }
}

function beqz(inputParams: InstructionInput): void {
  inputParams.rs2 = "x0";
  beq(inputParams);
}

function bne(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm, 12);
  if (
    getValueInRegister(inputParams.rs1)!
    !== getValueInRegister(inputParams.rs2)!
  ) {
    setRegister(
      "pc",
      binaryAdd(
        getValueInRegister("pc")!,
        binaryAdd(immBin, immBin) // jump in signed offest of 2 bytes
      )
    );
  }
}

function bnez(inputParams: InstructionInput): void {
  inputParams.rs2 = "x0";
  bne(inputParams);
}

function blt(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm, 12);
  if (
    twosComplementToDecimal(inputParams.rs1)
    < twosComplementToDecimal(inputParams.rs2)
  ) {
    setRegister(
      "pc",
      binaryAdd(
        getValueInRegister("pc")!,
        binaryAdd(immBin, immBin) // jump in signed offest of 2 bytes
      )
    );
  }
}

function bgt(inputParams: InstructionInput): void {
  const temp: string = inputParams.rs1;
  inputParams.rs1 = inputParams.rs2;
  inputParams.rs2 = temp;
  blt(inputParams);
}

function bltz(inputParams: InstructionInput): void {
  inputParams.rs2 = "x0";
  blt(inputParams);
}

function bgtz(inputParams: InstructionInput): void {
  inputParams.rs2 = inputParams.rs1;
  inputParams.rs1 = "x0";
  blt(inputParams);
}

function bltu(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm, 12);
  if (
    parseInt(inputParams.rs1, Base.BINARY)
    < parseInt(inputParams.rs2, Base.BINARY)
  ) {
    setRegister(
      "pc",
      binaryAdd(
        getValueInRegister("pc")!,
        binaryAdd(immBin, immBin) // jump in signed offest of 2 bytes
      )
    );
  }
}

function bgtu(inputParams: InstructionInput): void {
  const temp: string = inputParams.rs1;
  inputParams.rs1 = inputParams.rs2;
  inputParams.rs2 = temp;
  bltu(inputParams);
}

function bge(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm, 12);
  if (
    twosComplementToDecimal(inputParams.rs1)
    >= twosComplementToDecimal(inputParams.rs2)
  ) {
    setRegister(
      "pc",
      binaryAdd(
        getValueInRegister("pc")!,
        binaryAdd(immBin, immBin) // jump in signed offest of 2 bytes
      )
    );
  }
}

function ble(inputParams: InstructionInput): void {
  const temp: string = inputParams.rs1;
  inputParams.rs1 = inputParams.rs2;
  inputParams.rs2 = temp;
  bge(inputParams);
}

function blez(inputParams: InstructionInput): void {
  inputParams.rs2 = inputParams.rs1;
  inputParams.rs1 = "x0";
  bge(inputParams);
}

function bgez(inputParams: InstructionInput): void {
  inputParams.rs2 = "x0";
  bge(inputParams);
}

function bgeu(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  if (
    parseInt(inputParams.rs1, Base.BINARY)
    >= parseInt(inputParams.rs2, Base.BINARY)
  ) {
    setRegister(
      "pc",
      binaryAdd(
        getValueInRegister("pc")!,
        binaryAdd(immBin, immBin) // jump in signed offest of 2 bytes
      )
    );
  }
}

function bleu(inputParams: InstructionInput): void {
  const temp: string = inputParams.rs1;
  inputParams.rs1 = inputParams.rs2;
  inputParams.rs2 = temp;
  bgeu(inputParams);
}

function lw(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  setRegister(
    inputParams.rd,
    memory.get(
      parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY)
      + twosComplementToDecimal(immBin)
    )!
  );
}

function lh(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  setRegister(
    inputParams.rd,
    memory.get(
      parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY)
      + twosComplementToDecimal(immBin)
    )!.slice(-16),
    signExtend
  );
}

function lhu(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  setRegister(
    inputParams.rd,
    memory.get(
      parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY)
      + twosComplementToDecimal(immBin)
    )!.slice(-16),
    zeroExtend
  );
}

function lb(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  setRegister(
    inputParams.rd,
    memory.get(
      parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY)
      + twosComplementToDecimal(immBin)
    )!.slice(-8),
    signExtend
  );
}

function lbu(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  setRegister(
    inputParams.rd,
    memory.get(
      parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY)
      + twosComplementToDecimal(immBin)
    )!.slice(-8),
    zeroExtend
  );
}

function sw(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  memory.set(
    parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY) + twosComplementToDecimal(immBin),
    getValueInRegister(inputParams.rs2)!
  );
}

function sh(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  memory.set(
    parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY) + twosComplementToDecimal(immBin),
    memory.get(parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY) + twosComplementToDecimal(immBin))!.slice(0, 16)
      + getValueInRegister(inputParams.rs2)!.slice(-16)
  );
}

function sb(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  memory.set(
    parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY) + twosComplementToDecimal(immBin),
    memory.get(parseInt(getValueInRegister(inputParams.rs1)!, Base.BINARY) + twosComplementToDecimal(immBin))!.slice(0, 24)
      + getValueInRegister(inputParams.rs2)!.slice(-8)
  );
}
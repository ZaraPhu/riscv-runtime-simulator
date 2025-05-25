/*
This file is used to hold the helper functions for the runtime simulator script.
It also holds important constants which are used in the runtime simulator.
Author: Zara Phukan.
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

// Operand types for instruction formats
enum OperandType {
  IMMEDIATE, // Immediate values (constants)
  REGISTER, // Register references
}

// Parser status codes
enum ParserStatus {
  OK, // Parsing successful
  ERR, // Error occurred during parsing
}

// Structure for parser results
interface ParserResult {
  output: string[][]; // Processed instructions
  status: ParserStatus.OK | ParserStatus.ERR; // Result status
  errMessage: string; // Error message if applicable
}

interface InstructionDecodeInfo {
  funct3: string | undefined;
  funct7: string | undefined;
  opcode: string | undefined;
}

interface InstructionInfo {
  instructionFormat: OperandType[],
  executionFunction: Function,
  decodeFunction: Function,
  decodeInfo: InstructionDecodeInfo | undefined
}

interface InstructionInput {
  rd: string;
  rs1: string;
  rs2: string;
  imm: number;
}

/**
 * Instruction Format Definitions
 * Each format defines the expected operand types for different instruction categories
 */
// I-Type: Register-Immediate instructions (e.g., ADDI, SLTI)
const I_TYPE: OperandType[] = [
  OperandType.REGISTER, // Destination register
  OperandType.REGISTER, // Source register
  OperandType.IMMEDIATE, // Immediate value
];

// U-Type: Upper immediate instructions (e.g., LUI, AUIPC)
const U_TYPE: OperandType[] = [
  OperandType.REGISTER, // Destination register
  OperandType.IMMEDIATE, // Immediate value (upper 20 bits)
];

// R-Type: Register-Register operations (e.g., ADD, SUB)
const R_TYPE: OperandType[] = [
  OperandType.REGISTER, // Destination register
  OperandType.REGISTER, // Source register 1
  OperandType.REGISTER, // Source register 2
];

// Special instruction type formats
const NONE_TYPE: OperandType[] = []; // No operands (e.g., NOP)
const PSEUDO_TYPE_A: OperandType[] = [
  // Pseudo-instructions with 2 registers
  OperandType.REGISTER,
  OperandType.REGISTER,
];
const PSEUDO_TYPE_B: OperandType[] = [OperandType.IMMEDIATE];
const J_TYPE: OperandType[] = [OperandType.REGISTER, OperandType.IMMEDIATE]; // Jump instructions

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
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "ADDI") },
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "0010011" }
  }],
  ["MV", {
    instructionFormat: PSEUDO_TYPE_A,
    executionFunction: mv,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "MV") },
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "0010011" }
  }],
  ["NOP", {
    instructionFormat: PSEUDO_TYPE_A,
    executionFunction: nop,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "NOP") },
    decodeInfo: { funct3: "000", funct7: undefined, opcode: "0010011" }
  }],
  ["SLTI", {
    instructionFormat: I_TYPE,
    executionFunction: slti,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "SLTI") },
    decodeInfo: { funct3: "010", funct7: undefined, opcode: "0010011" }
  }],
  ["SLTIU", {
    instructionFormat: I_TYPE,
    executionFunction: sltiu,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "SLTIU") },
    decodeInfo: { funct3: "011", funct7: undefined, opcode: "0010011" }
  }],
  ["SEQZ", {
    instructionFormat: PSEUDO_TYPE_A,
    executionFunction: seqz,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "SEQZ") },
    decodeInfo: { funct3: "011", funct7: undefined, opcode: "0010011" }
  }],
  ["ANDI", {
    instructionFormat: I_TYPE,
    executionFunction: andi,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "ANDI") },
    decodeInfo: { funct3: "111", funct7: undefined, opcode: "0010011" }
  }],
  ["ORI", {
    instructionFormat: I_TYPE,
    executionFunction: ori,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "ORI") },
    decodeInfo: { funct3: "110", funct7: undefined, opcode: "0010011" }
  }],
  ["XORI", {
    instructionFormat: I_TYPE,
    executionFunction: xori,
    decodeFunction: (inputParams: InstructionInput) => { return iTypeDecode(inputParams, "XORI") },
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
    decodeFunction: (inputParams: InstructionInput) => { return uTypeDecode(inputParams, "LUI") },
    decodeInfo: { funct3: undefined, funct7: undefined, opcode: "0110111" }
  }],
  ["AUIPC", {
    instructionFormat: U_TYPE,
    executionFunction: auipc,
    decodeFunction: (inputParams: InstructionInput) => { return uTypeDecode(inputParams, "AUIPC") },
    decodeInfo: { funct3: undefined, funct7: undefined, opcode: "0010111" }
  }],
  ["ADD", {
    instructionFormat: R_TYPE,
    executionFunction: add,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "ADD") },
    decodeInfo: { funct3: "000", funct7: "0000000", opcode: "0110011" }
  }],
  ["SUB", {
    instructionFormat: R_TYPE,
    executionFunction: sub,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SUB") },
    decodeInfo: { funct3: "000", funct7: "0100000", opcode: "0110011" }
  }],
  ["SLT", {
    instructionFormat: R_TYPE,
    executionFunction: slt,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SLT") },
    decodeInfo: { funct3: "010", funct7: "0000000", opcode: "0110011" }
  }],
  ["SLTU", {
    instructionFormat: R_TYPE,
    executionFunction: sltu,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SLTU") },
    decodeInfo: { funct3: "011", funct7: "0000000", opcode: "0110011" }
  }],
  ["AND", {
    instructionFormat: R_TYPE,
    executionFunction: and,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "AND") },
    decodeInfo: { funct3: "111", funct7: "0000000", opcode: "0110011" }
  }],
  ["OR", {
    instructionFormat: R_TYPE,
    executionFunction: or,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "OR") },
    decodeInfo: { funct3: "110", funct7: "0000000", opcode: "0110011" }
  }],
  ["XOR", {
    instructionFormat: R_TYPE,
    executionFunction: xor,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "XOR") },
    decodeInfo: { funct3: "100", funct7: "0000000", opcode: "0110011" }
  }],
  ["SLL", {
    instructionFormat: R_TYPE,
    executionFunction: sll,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SLL") },
    decodeInfo: { funct3: "001", funct7: "0000000", opcode: "0110011" }
  }],
  ["SRL", {
    instructionFormat: R_TYPE,
    executionFunction: srl,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SRL") },
    decodeInfo: { funct3: "101", funct7: "0000000", opcode: "0110011" }
  }],
  ["SRA", {
    instructionFormat: R_TYPE,
    executionFunction: sra,
    decodeFunction: (inputParams: InstructionInput) => { return rTypeDecode(inputParams, "SRA") },
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
    decodeFunction: jalr_decode,
    decodeInfo: { funct3: undefined, funct7: undefined, opcode: "1101111" }
  }]
]);

/*** Functions ***/
function binaryToHex(binVal: string): string {
  /**
   * Converts a binary string to its hexadecimal representation.
   *
   * This function processes the binary string in groups of 4 bits, converting
   * each group to its corresponding hexadecimal digit. The input binary string
   * length should ideally be a multiple of 4 for proper conversion.
   *
   * @param binVal - The binary string to convert
   * @returns The hexadecimal representation of the input binary string
   */
  let hexVal = "";
  const binValCleaned: string = zeroExtend(
    binVal,
    Math.ceil(binVal.length / 4) * 4,
  );
  for (let i = 0; i < binValCleaned.length; i += 4) {
    hexVal += parseInt(binValCleaned.substring(i, i + 4), 2).toString(
      Base.HEXADECIMAL,
    );
  }
  return hexVal;
}

function binaryToOctal(binVal: string): string {
  /**
   * Converts a binary string to its octal representation.
   *
   * This function processes the binary string in groups of 3 bits, converting
   * each group to its corresponding octal digit. The function pads the input
   * binary string to ensure its length is a multiple of 3 bits.
   *
   * @param binVal - The binary string to convert
   * @returns The octal representation of the input binary string
   */
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
  /**
   * Sets the base for register value display in the simulator.
   *
   * This function validates the provided base against supported numeric bases
   * (binary, octal, decimal, or hexadecimal) and updates the global registerBase
   * variable. If an invalid base is provided, it defaults to decimal.
   *
   * @param base - The numeric base to use for register display (2, 8, 10, or 16)
   * @returns void - Updates the global registerBase variable
   */
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
  /**
   * Updates all register displays with current values in the selected base format.
   *
   * This function iterates through all register displays and formats the current
   * register values according to the globally selected base (registerBase). Each
   * value is displayed with the appropriate prefix:
   * - Binary: 0b prefix (e.g., 0b10101)
   * - Octal: 0o prefix (e.g., 0o7654)
   * - Hexadecimal: 0x prefix (e.g., 0xABCD)
   * - Decimal: no prefix, shown as signed value (e.g., -42)
   *
   * @returns void - Modifies the DOM elements directly to display formatted register values
   */
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
  /**
   * Sets a value to a specific register in the RISC-V register file.
   *
   * If the target register is x0 or pc, the value will always be set to 0 as per RISC-V spec.
   * For all other registers, the provided value will be set to the specified register.
   * The function also updates the register display after setting the value.
   *
   * @param rd - The destination register name (e.g., "x0", "sp", "a0")
   * @param val - The binary string value to set in the register
   * @param extendFunc - The function used to extend the value to XLEN bits (defaults to signExtend)
   * @returns void - Does not return a value
   */

  // Convert register name to register number
  const register: number = STRINGS_TO_REGISTERS.get(rd)!;
  let valCleaned: string = extendFunc(register == 0 ? "0" : val);

  // register values are always stored as binary strings
  registers.set(register, valCleaned);
  updateRegisterDisplays();
}

function zeroExtend(bits: string, len: number = XLEN): string {
  /**
   * Extends a binary string to the specified length by padding with zeros on the left.
   *
   * This function is used for unsigned values where the most significant bits should
   * be filled with zeros. If no length is specified, the function extends to XLEN bits.
   *
   * @param bits - The binary string to extend
   * @param len - The target length after extension (defaults to XLEN)
   * @returns A binary string padded with leading zeros to reach the specified length
   */
  return bits.padStart(len, "0");
}

function signExtend(bits: string, len: number = XLEN): string {
  /**
   * Extends a binary string to the specified length by padding with the sign bit on the left.
   *
   * This function is used for signed values to preserve the sign when extending the bit width.
   * It copies the leftmost bit (sign bit) as padding. If no length is specified, the function
   * extends to XLEN bits.
   *
   * @param bits - The binary string to extend (first bit is the sign bit)
   * @param len - The target length after extension (defaults to XLEN)
   * @returns A binary string sign-extended to the specified length
   */
  return bits.padStart(len, bits.charAt(0));
}

function decimalToTwosComplement(
  val: number,
  numDigits: number = XLEN,
): string {
  /**
   * Converts a decimal number to its two's complement binary representation.
   * @param val - The decimal number to convert
   * @param numDigits - The total number of bits in the resulting binary string
   * @returns A binary string representation in two's complement format
   * @assumption -2^(numDigits-1) <= val < 2^(numDigits-1)
   */
  if (val >= 0) {
    return zeroExtend(val.toString(Base.BINARY));
  }

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
  /**
   * Converts a binary string in two's complement format to its decimal representation.
   * @param bits - The binary string in two's complement format to convert
   * @returns The decimal representation of the two's complement binary input
   */
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
  /**
   * Performs a binary addition of two binary strings.
   * @param op1 - First binary string operand
   * @param op2 - Second binary string operand
   * @param extendFunc - Function used to extend operands to the same length (defaults to signExtend)
   * @returns The binary sum of the two operands as a string
   */

  let carry: number = 0;
  let sum: string = "";

  const len: number = Math.max(op1.length, op2.length);
  const cleanedOp1: string = extendFunc(op1, len);
  const cleanedOp2: string = extendFunc(op2, len);

  for (let i = len - 1; i >= 0; i--) {
    let num1: string = cleanedOp1.charAt(i);
    let num2: string = cleanedOp2.charAt(i);

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
  /**
   * Performs a binary subtraction of two binary strings using two's complement method.
   * @param op1 - First binary string operand (minuend)
   * @param op2 - Second binary string operand (subtrahend)
   * @param extendFunc - Function used to extend operands to the same length (defaults to signExtend)
   * @returns The binary difference of the two operands as a string
   */
  const len: number = Math.max(op1.length, op2.length);
  const cleanedOp2: string = extendFunc(op2, len);

  const op2Minus = binaryAdd(cleanedOp2, "1", signExtend); // first subtract 1 from the number
  let negOp2: string = "";
  for (let i = len - 1; i >= 0; i--) {
    // then flip all the bits
    negOp2 = (op2Minus.charAt(i) == "0" ? "1" : "0") + negOp2;
  }
  return binaryAdd(op1, negOp2);
}

function iTypeDecode(inputParams: InstructionInput, instructionName: string): string {
  const decodeInfo: InstructionDecodeInfo = INSTRUCTION_TO_INFO.get(instructionName)!.decodeInfo!;
  return (
    decimalToTwosComplement(Number(inputParams.imm)).slice(-12) // imm
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rs1)!.toString(Base.BINARY), 5) //rs
    + decodeInfo.funct3! // funct3
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rd)!.toString(Base.BINARY), 5) // rd
    + zeroExtend(decodeInfo.opcode!)  // opcode
  );
}

function addi(inputParams: InstructionInput): void {
  /**
   * Implements the ADDI instruction (Add Immediate).
   *
   * Adds a 12-bit signed immediate value to the value in the source register,
   * and stores the result in the destination register.
   * The function also generates the machine code representation of the instruction.
   *
   * @param rd - The destination register name (e.g., "x1", "t0")
   * @param rs - The source register name containing the base value
   * @param imm - The immediate value to add
   * @returns The machine code representation of the instruction as a binary string
   */
  const binarySum: string = binaryAdd(
    decimalToTwosComplement(Number(inputParams.imm)).slice(-12),
    registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!
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
    twosComplementToDecimal(registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!)
    < twosComplementToDecimal(decimalToTwosComplement(Number(inputParams.imm)).slice(-12))
  );
  setRegister(inputParams.rd, isLessThan ? "1" : "0", zeroExtend);
}

function sltiu(inputParams: InstructionInput): void {
  const isLessThanUnsigned: boolean = (
    twosComplementToDecimal(registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!)
    < parseInt(decimalToTwosComplement(Number(inputParams.imm)).slice(-12), Base.BINARY)
  );
  setRegister(inputParams.rd, isLessThanUnsigned ? "1" : "0", zeroExtend);
}

function seqz(inputParams: InstructionInput): void {
  inputParams.imm = 1;
  sltiu(inputParams);
}

function andi(inputParams: InstructionInput): void {
  const immBits: string[] = decimalToTwosComplement(Number(inputParams.imm)).slice(-12).split("");
  const sourceBits: string[] = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!.split("");
  const resultBits: string[] = [];
  for (let i: number = 0; i < XLEN; i++) {
    resultBits[i] = ((immBits[i] === "1") && (sourceBits[i] === "1")) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function ori(inputParams: InstructionInput): void {
  const immBits: string[] = decimalToTwosComplement(Number(inputParams.imm)).slice(-12).split("");
  const sourceBits: string[] = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!.split("");
  const resultBits: string[] = [];
  for (let i: number = 0; i < XLEN; i++) {
    resultBits[i] = ((immBits[i] === "1") || (sourceBits[i] === "1")) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function xori(inputParams: InstructionInput): void {
  const immBits: string[] = decimalToTwosComplement(Number(inputParams.imm)).slice(-12).split("");
  const sourceBits: string[] = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!.split("");
  const resultBits: string[] = [];
  for (let i: number = 0; i < XLEN; i++) {
    resultBits[i] = !(immBits[i] === sourceBits[i]) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function slli(inputParams: InstructionInput): void {
  const result: string = (
    registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!
    + "0".repeat(parseInt(decimalToTwosComplement(Number(inputParams.imm)).slice(-5), Base.BINARY))
  ).slice(-XLEN);
  setRegister(inputParams.rd, result);
}

function slli_decode(inputParams: InstructionInput): string {
  const instructionInfo: InstructionInfo = INSTRUCTION_TO_INFO.get("SLLI")!;
  const machineCode: string = (
    "0".repeat(7)
    + decimalToTwosComplement(Number(inputParams.imm)).slice(-5) // imm
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rs1)!.toString(Base.BINARY), 5) //rs
    + instructionInfo.decodeInfo!.funct3! // funct3
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rd)!.toString(Base.BINARY), 5) // rd
    + zeroExtend(instructionInfo.decodeInfo!.opcode!)  // opcode
  );
  return machineCode;
}

function srli(inputParams: InstructionInput): void {
  const result: string = (
    "0".repeat(parseInt(decimalToTwosComplement(inputParams.imm).slice(-5), Base.BINARY))
    + registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!
  ).slice(0, XLEN);
  setRegister(inputParams.rd, result);
}

function srli_decode(inputParams: InstructionInput): string {
  const instructionInfo: InstructionInfo = INSTRUCTION_TO_INFO.get("SRLI")!;
  const machineCode: string = (
    "0".repeat(7)
    + decimalToTwosComplement(Number(inputParams.imm)).slice(-5) // imm
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rs1)!.toString(Base.BINARY), 5) //rs
    + instructionInfo.decodeInfo!.funct3! // funct3
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rd)!.toString(Base.BINARY), 5) // rd
    + zeroExtend(instructionInfo.decodeInfo!.opcode!)  // opcode
  );
  return machineCode;
}

function srai(inputParams: InstructionInput): void {
  const immVal: number = parseInt(inputParams.imm.toString(Base.BINARY).slice(-5), Base.BINARY);
  const sourceBits: string = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!;
  let result: string = "";
  if (sourceBits[0].localeCompare("0")) {
    result = ("1".repeat(immVal) + sourceBits).slice(0, XLEN);
  } else {
    result = ("0".repeat(immVal) + sourceBits).slice(0, XLEN);
  }
  setRegister(inputParams.rd, result);
}

function srai_decode(inputParams: InstructionInput): string {
  const instructionInfo: InstructionInfo = INSTRUCTION_TO_INFO.get("SRLI")!;
  const machineCode: string = (
    "01" + "0".repeat(5)
    + decimalToTwosComplement(Number(inputParams.imm)).slice(-5) // imm
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rs1)!.toString(Base.BINARY), 5) //rs
    + instructionInfo.decodeInfo!.funct3! // funct3
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rd)!.toString(Base.BINARY), 5) // rd
    + zeroExtend(instructionInfo.decodeInfo!.opcode!)  // opcode
  );
  return machineCode;
}

function uTypeDecode(inputParams: InstructionInput, instructionName: string) {
  return (
    decimalToTwosComplement(Number(inputParams.imm),).slice(0, 20)
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rd)!.toString(Base.BINARY), 5)
    + INSTRUCTION_TO_INFO.get(instructionName)!.decodeInfo!.opcode
  );
}

function lui(inputParams: InstructionInput): void {
  /**
   * Implements the LUI instruction (Load Upper Immediate).
   *
   * Loads the immediate value into the upper 20 bits of the destination register,
   * and sets the lower 12 bits to zero. This instruction is typically used to
   * build 32-bit constants when combined with an instruction that sets the lower bits.
   *
   * @param rd - The destination register name where the result will be stored
   * @param imm - The immediate value to load into the upper 20 bits (sign-extended)
   * @returns An empty string as the machine code representation is not implemented
   */
  const upperBits: string = decimalToTwosComplement(
    Number(inputParams.imm),
  ).slice(0, 20);
  setRegister(inputParams.rd, upperBits + zeroExtend("0", 12));
}

function auipc(inputParams: InstructionInput): void {
  /**
   * Implements the AUIPC instruction (Add Upper Immediate to PC).
   *
   * Adds the immediate value (shifted left by 12 bits) to the address of the
   * AUIPC instruction (stored in the PC register), and stores the result in
   * the destination register. This instruction is commonly used for PC-relative
   * addressing, such as constructing addresses farther than 12 bits from the PC.
   *
   * The immediate value is sign-extended and placed in the upper 20 bits of a 32-bit
   * word, with the lower 12 bits filled with zeros. This value is then added to the PC
   * and the result is stored in the destination register.
   *
   * @param rd - The destination register name where the result will be stored
   * @param imm - The immediate value to be added to the PC (upper 20 bits)
   * @returns An empty string as the machine code representation is not implemented
   */
  const upperBits: string = decimalToTwosComplement(
    Number(inputParams.imm),
  ).slice(0, 20);
  const result: string = binaryAdd(
    upperBits + zeroExtend("0", 12),
    registers.get(STRINGS_TO_REGISTERS.get("pc")!)!,
  );
  setRegister(inputParams.rd, result);
}

function rTypeDecode(inputParams: InstructionInput, instructionName: string): string {
  const decodeInfo: InstructionDecodeInfo = INSTRUCTION_TO_INFO.get(instructionName)!.decodeInfo!;
  return (
    decodeInfo.funct7
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rs2)!.toString(Base.BINARY), 5)
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rs1)!.toString(Base.BINARY), 5)
    + decodeInfo.funct3
    + zeroExtend(STRINGS_TO_REGISTERS.get(inputParams.rd)!.toString(Base.BINARY), 5)
    + decodeInfo.opcode
  );
}

function add(inputParams: InstructionInput): void {
  const sumValue: string = binaryAdd(
    registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!,
    registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!,
  );
  setRegister(inputParams.rd, signExtend(sumValue));
}

function sub(inputParams: InstructionInput): void {
  const subValue: string = binarySub(
    registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!,
    registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!,
  );
  setRegister(inputParams.rd, signExtend(subValue));
}

function slt(inputParams: InstructionInput): void {
  setRegister(
    inputParams.rd,
    zeroExtend(
      String(
        twosComplementToDecimal(
          registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!,
        ) <
        twosComplementToDecimal(
          registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!,
        ),
      ),
    ),
  );
}

function sltu(inputParams: InstructionInput): void {
  setRegister(
    inputParams.rd,
    String(
      parseInt(
        registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!,
        Base.BINARY,
      ) <
      parseInt(
        registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!,
        Base.BINARY,
      ),
    ),
  );
}

function and(inputParams: InstructionInput): void {
  const source1Bits: string[] = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!.split("");
  const source2Bits: string[] = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!.split("");
  const resultBits: string[] = [];
  for (let i = 0; i < XLEN; i++) {
    resultBits[i] = ((source1Bits[i] == "1") && (source2Bits[i] == "1")) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function or(inputParams: InstructionInput): void {
  const source1Bits: string[] = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!.split("");
  const source2Bits: string[] = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!.split("");
  const resultBits: string[] = [];
  for (let i = 0; i < XLEN; i++) {
    resultBits[i] = ((source1Bits[i] === "1") || (source2Bits[i] === "1")) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function xor(inputParams: InstructionInput): void {
  const source1Bits: string[] = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!.split("");
  const source2Bits: string[] = registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!.split("");
  const resultBits: string[] = [];
  for (let i = 0; i < XLEN; i++) {
    resultBits[i] = !(source1Bits[i] === source2Bits[i]) ? "1" : "0";
  }
  setRegister(inputParams.rd, resultBits.join(""));
}

function sll(inputParams: InstructionInput): void {
  const rs2Val: number = parseInt(
    registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!.slice(-5),
    Base.BINARY,
  );
  const sourceBin: string = registers.get(
    STRINGS_TO_REGISTERS.get(inputParams.rs1)!,
  )!;
  setRegister(
    inputParams.rd,
    (sourceBin + zeroExtend("0", rs2Val)).slice(-XLEN),
  );
}

function srl(inputParams: InstructionInput): void {
  const rs2Val: number = parseInt(
    registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!.slice(-5),
    Base.BINARY,
  );
  const sourceBin: string = registers.get(
    STRINGS_TO_REGISTERS.get(inputParams.rs1)!,
  )!;
  setRegister(
    inputParams.rd,
    (zeroExtend("0", rs2Val) + sourceBin).substring(0, XLEN),
  );
}

function sra(inputParams: InstructionInput): void {
  const rs2Val: number = parseInt(
    registers.get(STRINGS_TO_REGISTERS.get(inputParams.rs2)!)!.slice(-5),
    Base.BINARY,
  );
  const sourceBin: string = registers.get(
    STRINGS_TO_REGISTERS.get(inputParams.rs1)!,
  )!;
  if (inputParams.rs1[0].localeCompare("0") == 0) {
    setRegister(
      inputParams.rd,
      (zeroExtend("0", rs2Val) + sourceBin).substring(0, XLEN),
    );
  } else {
    setRegister(
      inputParams.rd,
      (zeroExtend("1", rs2Val) + sourceBin).substring(0, XLEN),
    );
  }
}

function jal(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-20);
  setRegister(
    inputParams.rd,
    binaryAdd(
      registers.get(STRINGS_TO_REGISTERS.get("pc")!)!,
      "100",
      zeroExtend,
    ),
  );
  for (let i = 0; i < 2; i++) {
    // immediate is multiple of 2 bytes
    setRegister(
      "pc",
      binaryAdd(registers.get(STRINGS_TO_REGISTERS.get("pc")!)!, immBin),
    );
  }
}

function jal_decode(inputParams: InstructionInput): string {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-20);
  const decodeInfo: InstructionDecodeInfo =
    INSTRUCTION_TO_INFO.get("JAL")!.decodeInfo!;
  let machineCode: string =
    immBin.charAt(19) +
    immBin.slice(0, 9) +
    immBin.charAt(10) +
    immBin.slice(11, 18) +
    zeroExtend(
      STRINGS_TO_REGISTERS.get(inputParams.rd)!.toString(Base.BINARY),
      5,
    ) +
    decodeInfo.opcode;
  return machineCode;
}

function j(inputParams: InstructionInput): void {
  inputParams.rd = "x0";
  jal(inputParams);
}

function j_decode(inputParams: InstructionInput): string {
  inputParams.rd = "x0";
  return jal_decode(inputParams);
}

function not(inputParams: InstructionInput): void {
  const bits: string[] = registers
    .get(STRINGS_TO_REGISTERS.get(inputParams.rs1)!)!
    .split("");
  for (let i = 0; i < bits.length; i++) {
    bits[i] = bits[i].localeCompare("1") == 0 ? "0" : "1";
  }
  setRegister(inputParams.rd, bits.join(""));
}

function jalr(inputParams: InstructionInput): void {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  const sourceRegisterVal: number = STRINGS_TO_REGISTERS.get(inputParams.rs1)!;
  const result: string[] = binaryAdd(
    immBin,
    registers.get(sourceRegisterVal)!,
  ).split("");
  result[-1] = "0";
  setRegister(
    "pc",
    binaryAdd(registers.get(STRINGS_TO_REGISTERS.get("pc")!)!, result.join("")),
  );
  setRegister(
    inputParams.rd,
    binaryAdd(
      registers.get(STRINGS_TO_REGISTERS.get("pc")!)!,
      "100",
      zeroExtend,
    ),
  );
}

function jalr_decode(inputParams: InstructionInput): string {
  const immBin: string = decimalToTwosComplement(inputParams.imm).slice(-12);
  const sourceRegisterVal: number = STRINGS_TO_REGISTERS.get(inputParams.rs1)!;
  const decodeInfo: InstructionDecodeInfo =
    INSTRUCTION_TO_INFO.get("JAL")!.decodeInfo!;
  let machineCode: string =
    immBin +
    zeroExtend(sourceRegisterVal.toString(Base.BINARY), 5) +
    decodeInfo.funct3 +
    zeroExtend(
      STRINGS_TO_REGISTERS.get(inputParams.rd)!.toString(Base.BINARY),
      5,
    ) +
    decodeInfo.opcode;
  return machineCode;
}

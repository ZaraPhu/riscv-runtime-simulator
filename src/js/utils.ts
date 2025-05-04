/*
This file is used to hold the helper functions for the runtime simulator script.
It carries out the assembly instructions. It also holds important constants which
are used in the runtime simulator.
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
  IMMEDIATE,  // Immediate values (constants)
  REGISTER,   // Register references
}

// Parser status codes
enum ParserStatus {
  OK,   // Parsing successful
  ERR,  // Error occurred during parsing
}

// Structure for parser results
interface ParserResult {
  output: string[][];              // Processed instructions
  status: ParserStatus.OK | ParserStatus.ERR;  // Result status
  errMessage: string               // Error message if applicable
}

/**
 * Instruction Format Definitions
 * Each format defines the expected operand types for different instruction categories
 */
// I-Type: Register-Immediate instructions (e.g., ADDI, SLTI)
const I_TYPE: OperandType[] = [
  OperandType.REGISTER,  // Destination register
  OperandType.REGISTER,  // Source register
  OperandType.IMMEDIATE, // Immediate value
];

// U-Type: Upper immediate instructions (e.g., LUI, AUIPC)
const U_TYPE: OperandType[] = [
  OperandType.REGISTER,  // Destination register
  OperandType.IMMEDIATE, // Immediate value (upper 20 bits)
];

// R-Type: Register-Register operations (e.g., ADD, SUB)
const R_TYPE: OperandType[] = [
  OperandType.REGISTER,  // Destination register
  OperandType.REGISTER,  // Source register 1
  OperandType.REGISTER,  // Source register 2
];

// Special instruction type formats
const NONE_TYPE: OperandType[] = [];  // No operands (e.g., NOP)
const PSEUDO_TYPE: OperandType[] = [  // Pseudo-instructions with 2 registers
  OperandType.REGISTER,
  OperandType.REGISTER
];
const J_TYPE: OperandType[] = [];     // Jump instructions

/**
 * Register System
 */
// Storage for current register values (including program counter)
const registers: Map<number, string> = new Map(
  Array.from({ length: 33 }, (_, i) => [i, zeroExtend("0")]),
);

/**
 * Memory System
 */
const memory: Map<number, string> = new Map(
  Array.from({ length: 256 }, (_, i) => [i, zeroExtend("0")])
);

/**
 * Register Name Mapping
 * Maps register names to their numeric identifiers
 * Includes both x-style names (x0-x31) and ABI names (zero, ra, sp, etc.)
 */
const STRINGS_TO_REGISTERS: ReadonlyMap<string, number> = new Map([
  // General Register Names (x0-x31)
  ["x0", 0],  ["x1", 1],  ["x2", 2],  ["x3", 3],
  ["x4", 4],  ["x5", 5],  ["x6", 6],  ["x7", 7],
  ["x8", 8],  ["x9", 9],  ["x10", 10], ["x11", 11],
  ["x12", 12], ["x13", 13], ["x14", 14], ["x15", 15],
  ["x16", 16], ["x17", 17], ["x18", 18], ["x19", 19],
  ["x20", 20], ["x21", 21], ["x22", 22], ["x23", 23],
  ["x24", 24], ["x25", 25], ["x26", 26], ["x27", 27],
  ["x28", 28], ["x29", 29], ["x30", 30], ["x31", 31],
  ["pc", 32],  // Program Counter

  // ABI Register Names
  ["zero", 0], // Hard-wired zero
  ["ra", 1],   // Return address
  ["sp", 2],   // Stack pointer
  ["gp", 3],   // Global pointer
  ["tp", 4],   // Thread pointer
  ["t0", 5],   // Temporary registers
  ["t1", 6],
  ["t2", 7],
  ["fp", 8],   // Frame pointer (alias for s0)
  ["s0", 8],   // Saved registers
  ["s1", 9],
  ["a0", 10],  // Function argument/return registers
  ["a1", 11],
  ["a2", 12],
  ["a3", 13],
  ["a4", 14],
  ["a5", 15],
  ["a6", 16],
  ["a7", 17],
  ["s2", 18],  // More saved registers
  ["s3", 19],
  ["s4", 20],
  ["s5", 21],
  ["s6", 22],
  ["s7", 23],
  ["s8", 24],
  ["s9", 25],
  ["s10", 26],
  ["s11", 27],
  ["t3", 28],  // More temporary registers
  ["t4", 29],
  ["t5", 30],
  ["t6", 31],
]);

/**
 * Instruction Format Mapping
 * Maps each instruction mnemonic to its expected operand format
 */
const INSTRUCTION_TO_FORMAT: ReadonlyMap<string, OperandType[]> = new Map([
  // I-Type instructions
  ["ADDI", I_TYPE],   // Add immediate
  ["SLTI", I_TYPE],   // Set less than immediate
  ["SLTIU", I_TYPE],  // Set less than immediate unsigned
  ["ANDI", I_TYPE],   // AND immediate
  ["ORI", I_TYPE],    // OR immediate
  ["XORI", I_TYPE],   // XOR immediate
  ["SLLI", I_TYPE],   // Shift left logical immediate
  ["SRLI", I_TYPE],   // Shift right logical immediate
  ["SRAI", I_TYPE],   // Shift right arithmetic immediate

  // U-Type instructions
  ["LUI", U_TYPE],    // Load upper immediate
  ["AUIPC", U_TYPE],  // Add upper immediate to PC

  // R-Type instructions
  ["ADD", R_TYPE],    // Add
  ["SUB", R_TYPE],    // Subtract
  ["SLT", R_TYPE],    // Set less than
  ["SLTU", R_TYPE],   // Set less than unsigned
  ["SLL", R_TYPE],    // Shift left logical
  ["SRL", R_TYPE],    // Shift right logical

  // Special instructions
  ["NOP", NONE_TYPE],   // No operation
  ["MV", PSEUDO_TYPE],  // Move register to register
  ["SEQZ", PSEUDO_TYPE], // Set if equal to zero
  ["NOT", PSEUDO_TYPE],  // Bitwise NOT
  ["JAL", J_TYPE],      // Jump and link
  ["JALR", J_TYPE],     // Jump and link register
]);

// I_INSTRUCTION_TO_FUNCTION is a map of all the I-type instructions to their corresponding functions
const I_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function> = new Map([
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

// U_INSTRUCTION_TO_FUNCTION is a map of all the U-type instructions to their corresponding functions
const U_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function> = new Map([
  ["LUI", lui],
  ["AUIPC", auipc],
]);

// R_INSTRUCTION_TO_FUNCTION is a map of all the R-type instructions to their corresponding functions
const R_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function> = new Map([
  ["ADD", add],
  ["SUB", sub],
  ["SLT", slt],
  ["SLTU", sltu],
  ["SLL", sll],
  ["SRL", srl],
]);

// NONE_INSTRUCTION_TO_FUNCTION is a map of all the none-type instructions to their corresponding functions
const NONE_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function> = new Map([
  ["NOP", () => {}],
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
  const binValCleaned: string = zeroExtend(binVal, Math.ceil(binVal.length / 4) * 4);
  for (let i = 0; i < binValCleaned.length; i += 4) {
    hexVal += parseInt(binValCleaned.substring(i, i + 4), 2).toString(Base.HEXADECIMAL);
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
  const binValCleaned: string = zeroExtend(binVal, Math.ceil(binVal.length / 3) * 3);
  for (let i = 0; i < binValCleaned.length; i += 3) {
    const octDigit = parseInt(binValCleaned.substring(i, i + 3), 2).toString(Base.OCTAL);
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
  registerBase = [Base.BINARY, Base.OCTAL, Base.DECIMAL, Base.HEXADECIMAL].includes(base) ? base : Base.DECIMAL;
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

function setRegister(rd: string, val: string, extendFunc: Function = signExtend): void {
  /**
   * Sets a value to a specific register in the RISC-V register file.
   * 
   * If the target register is x0, the value will always be set to 0 as per RISC-V spec.
   * For all other registers, the provided value will be set to the specified register.
   *
   * @param rd - The destination register name (e.g., "x0", "sp", "a0")
   * @param val - The binary string value to set in the register
   * @returns true if the register was successfully set, false if the input value had invalid length
   * @throws Error if the register name is not found in STRINGS_TO_REGISTERS map
   */

  // Convert register name to register number
  const register: number = STRINGS_TO_REGISTERS.get(rd)!;
  let valCleaned: string = extendFunc((register == 0) ? "0" : val);

  // register values are always stored as binary strings
  registers.set(register, valCleaned);
  updateRegisterDisplays();
}

function zeroAllRegisters() { 
  /**
   * Resets all registers to zero.
   * 
   * This function iterates through all registers in the RISC-V register file,
   * including the program counter (PC), and sets their values to zero.
   * It's used to initialize or reset the register state before program execution.
   * After resetting the registers, it updates the register displays.
   */
  for (let i: number = 0; i < XLEN + 1; i++) { 
    registers.set(i, zeroExtend("0"));
  }
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
  return bits.padStart(len, bits.charAt(0))
}

function decimalToTwosComplement(val: number, numDigits: number = XLEN): string {
  /**
   * Converts a decimal number to its two's complement binary representation.
   *
   * This function handles both positive and negative numbers:
   * - For positive numbers, it returns the binary representation padded to numDigits
   * - For negative numbers, it calculates the two's complement by:
   *   1. Taking the absolute value of the number
   *   2. Converting to binary and padding
   *   3. Inverting all bits (1s become 0s and vice versa)
   *   4. Adding 1 to the result
   *
   * @param val - The decimal number to convert
   * @param numDigits - The total number of bits in the resulting binary string
   * @returns A binary string representation in two's complement format
   * @assumption -2^(numDigits-1) <= val < 2^(numDigits-1)
   */

  // Handle positive numbers directly - just return binary representation
  if (val >= 0) {
    return zeroExtend(val.toString(2));
  }

  // --- STEP 1: Get absolute value and convert to binary ---
  const absVal: number = Math.abs(val);
  const bits: string = zeroExtend(absVal.toString(2));

  // --- STEP 2: Convert string to array and invert all bits ---
  let chars: string[] = [...bits];
  chars = chars.map((char) => (char === "0" ? "1" : "0"));

  // --- STEP 3: Add one to the inverted result ---
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] === "1") {
      chars[i] = "0";
    } else {
      chars[i] = "1";
      break;
    }
  }

  // --- STEP 4: Return the result at the correct length ---
  return chars.join("").slice(-numDigits);
}

function twosComplementToDecimal(bits: string): number {
  /**
   * Converts a binary string in two's complement format to its decimal representation.
   * 
   * This function handles both positive and negative numbers:
   * - For positive numbers (MSB = 0), it directly converts from binary to decimal
   * - For negative numbers (MSB = 1), it follows the two's complement conversion:
   *   1. Inverting all bits
   *   2. Adding 1 to the inverted value
   *   3. Interpreting the result as a negative decimal value
   * 
   * @param bits - The binary string in two's complement format to convert
   * @returns The decimal representation of the two's complement binary input
   */
  // Check if the number is negative (most significant bit is 1)
  if (bits[0] === "1") {
    // Convert to decimal using two's complement
    let invertedBits: string = bits.split("").map((bit) => (bit === "0" ? "1" : "0")).join(""); // flip all the bits
    const result: number = parseInt(invertedBits, 2) + 1; // parse as an integer
    return -result;
  } else {
    // Convert to decimal directly
    return parseInt(bits, 2);
  }
}

function binaryAdd(op1: string, op2: string, extendFunc: Function = signExtend): string {
  /**
   * Performs a binary addition of two binary strings.
   *
   * This function simulates the process of adding two binary numbers together
   * the same way it would be done by hand, processing each bit position from
   * right to left and tracking the carry. The operands are extended to the same 
   * length using the provided extension function.
   *
   * @param op1 - First binary string operand
   * @param op2 - Second binary string operand
   * @param extendFunc - Function used to extend operands to the same length (defaults to signExtend)
   * @returns The binary sum of the two operands as a string
   */

  // Initialize carry bit and result string
  let carry: number = 0;
  let sum: string = "";

  // Determine the maximum length and pad both operands to the same length
  const len: number = Math.max(op1.length, op2.length);
  const cleanedOp1: string = extendFunc(op1, len);
  const cleanedOp2: string = extendFunc(op2, len);

  // Process each bit from right to left (least to most significant bit)
  for (let i = len - 1; i >= 0; i--) {
    // Get the bits at the current position
    let num1: string = cleanedOp1.charAt(i);
    let num2: string = cleanedOp2.charAt(i);

    // Calculate the current bit of the result
    // If the sum of the two bits plus the carry is even, the result bit is 0
    // Otherwise, the result bit is 1
    let decSum: number = parseInt(num1) + parseInt(num2) + Number(carry);
    sum = ((decSum % 2 == 0) ? "0" : "1") + sum;

    // Calculate the carry for the next position
    // If the sum of the two bits plus the carry is 2 or greater, the carry is 1
    // Otherwise, the carry is 0
    carry = (decSum >= 2) ? 1 : 0;
  }
  return sum;
}

function binarySub(op1: string, op2: string, extendFunc: Function = signExtend) {
  /** does op1 - op2 which is the same as op1 + (- op2) **/
  const len: number = Math.max(op1.length, op2.length);
  const cleanedOp1: string = extendFunc(op1, len);
  const cleanedOp2: string = extendFunc(op2, len);

  const op2Minus = binaryAdd(cleanedOp2, "1"); // first subtract 1 from the number
  let negOp2: string = "";
  for (let i = len - 1; i >= 0; i--) { // then flip all the bits
    negOp2 = ((op2Minus.charAt(i) == "0") ? "1" : "0") + negOp2;
  }
  return binaryAdd(op1, negOp2);
}

function addi(rd: string, rs1: string, imm: number): string {
  /**
   * Implements the ADDI instruction (Add Immediate).
   * 
   * Adds a 12-bit signed immediate value to the value in the source register,
   * and stores the result in the destination register.
   * If the immediate value exceeds the 12-bit signed range (-2048 to 2047),
   * it will be rejected with an error message.
   *
   * @param rd - The destination register name (e.g., "x1", "t0")
   * @param rs1 - The source register name containing the base value
   * @param imm - The immediate value to add (must be in range -2048 to 2047)
   * @returns true if the operation was successful, false otherwise
   * @throws Error via raiseError function if immediate value is out of range
   */
  const immBin: string = decimalToTwosComplement(imm).slice(-12);
  let machineCode: string = immBin;

  const sourceRegisterBin: string = zeroExtend((STRINGS_TO_REGISTERS.get(rs1)!).toString(2), 5);
  machineCode = machineCode + sourceRegisterBin;

  machineCode = machineCode + "000";

  const destRegisterBin: string = zeroExtend((STRINGS_TO_REGISTERS.get(rd)!).toString(2), 5);
  machineCode = machineCode + destRegisterBin;

  const opcode: string = zeroExtend("0", 7);
  machineCode = machineCode + opcode;

  const sourceValue: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  const binarySum: string = binaryAdd(sourceValue, decimalToTwosComplement(imm, XLEN));
  setRegister(rd, binarySum);

  return machineCode;
}

function slti(rd: string, rs1: string, imm: number): string {
  /**
   * Implements the SLTI instruction (Set Less Than Immediate).
   * Sets the destination register to 1 if the value in the source register is less than
   * the immediate value, otherwise sets it to 0.
   *
   * @param rd - The destination register name
   * @param rs1 - The source register name
   * @param imm - The immediate value to compare against
   * @returns true if the operation was successful, false if trying to modify register x0
   */
  const immBin: string = decimalToTwosComplement(imm).slice(-12);
  let machineCode: string = immBin;

  const sourceRegisterBin: string = zeroExtend((STRINGS_TO_REGISTERS.get(rs1)!).toString(2), 5);
  machineCode = machineCode + sourceRegisterBin;

  machineCode = machineCode + "001";

  const destRegisterBin: string = zeroExtend((STRINGS_TO_REGISTERS.get(rd)!).toString(2), 5);
  machineCode = machineCode + destRegisterBin;

  const opcode: string = zeroExtend("0", 7);
  machineCode = machineCode + opcode;

  const sourceValue: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  setRegister(rd, (twosComplementToDecimal(sourceValue) < imm) ? "1" : "0");

  return machineCode;
}

function sltiu(rd: string, rs1: string, imm: number): string {
  /**
   * Implements the SLTIU instruction (Set Less Than Immediate Unsigned).
   * Sets the destination register to 1 if the value in the source register is less than
   * the immediate value when treated as unsigned values, otherwise sets it to 0.
   *
   * @param rd - The destination register name
   * @param rs1 - The source register name
   * @param imm - The immediate value to compare against
   * @returns true if the operation was successful, false if trying to modify register x0
   */
  const immBin: string = decimalToTwosComplement(imm).slice(-12);
  let machineCode: string = immBin;

  const sourceRegisterBin: string = zeroExtend((STRINGS_TO_REGISTERS.get(rs1)!).toString(2), 5);
  machineCode = machineCode + sourceRegisterBin;

  machineCode = machineCode + "010";

  const destRegisterBin: string = zeroExtend((STRINGS_TO_REGISTERS.get(rd)!).toString(2), 5);
  machineCode = machineCode + destRegisterBin;

  const opcode: string = zeroExtend("0", 7);
  machineCode = machineCode + opcode;

  const sourceValue: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  // first sign extend imm to XLEN bits, then treat as unsigned number
  const immUnsigned: number = parseInt(zeroExtend(decimalToTwosComplement(imm, 12)));
  setRegister(rd, (twosComplementToDecimal(sourceValue) < immUnsigned) ? "1" : "0");

  return machineCode;
}

function andi(rd: string, rs1: string, imm: number): string {
  /**
   * Implements the ANDI instruction (AND Immediate).
   * Performs a bitwise AND operation between the value in the source register
   * and the immediate value, storing the result in the destination register.
   *
   * @param rd - The destination register name
   * @param rs1 - The source register name
   * @param imm - The immediate value for the AND operation
   * @returns true if the operation was successful, false if trying to modify register x0
   */
  const sourceBin: string[] = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!.split("");
  const immBin: string[] = decimalToTwosComplement(imm, XLEN).split("");
  const result: string[] = [];
  for (let i: number = 0; i < XLEN; i++) {
    result[i] = (immBin[i] === "1") && (sourceBin[i] === "1") ? "1" : "0";
  }
  setRegister(rd, result.join(""));
  return "";
}

function ori(rd: string, rs1: string, imm: number): string {
  /**
   * Implements the ORI instruction (OR Immediate).
   * Performs a bitwise OR operation between the value in the source register
   * and the immediate value, storing the result in the destination register.
   *
   * @param rd - The destination register name
   * @param rs1 - The source register name
   * @param imm - The immediate value for the OR operation
   * @returns true if the operation was successful, false if trying to modify register x0
   */
  const sourceBin: string[] = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!.split("");
  const immBin: string[] = decimalToTwosComplement(imm, XLEN).split("");
  const result: string[] = [];
  for (let i: number = 0; i < XLEN; i++) { 
    result[i] = (immBin[i] === "1") || (sourceBin[i] === "1") ? "1" : "0";
  }
  setRegister(rd, result.join(""));
  return "";
}

function xori(rd: string, rs1: string, imm: number): string {
  /**
   * Implements the XORI instruction (XOR Immediate).
   * Performs a bitwise XOR operation between the value in the source register
   * and the immediate value, storing the result in the destination register.
   *
   * @param rd - The destination register name
   * @param rs1 - The source register name
   * @param imm - The immediate value for the XOR operation
   * @returns true if the operation was successful, false if trying to modify register x0
   */
  const sourceBin: string[] = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!.split("");
  const immBin: string[] = decimalToTwosComplement(imm, XLEN).split("");
  const result: string[] = [];
  for (let i: number = 0; i < XLEN; i++) { 
    result[i] = !(immBin[i] === sourceBin[i]) ? "1" : "0";
  }
  setRegister(rd, result.join(""));
  return "";
}

function slli(rd: string, rs1: string, imm: number): string {
  return "";
}
function srli(rd: string, rs1: string, imm: number): string {
  console.log("Called srli function.");
  return "";
}

function srai(rd: string, rs1: string, imm: number): string {
  console.log("Called srai function.");
  return "";
}

function lui(rd: string, imm: number): string {
  const bits: string[] = decimalToTwosComplement(imm).split("");
  for (let i = 0; i < XLEN; i++) {
    if ((XLEN - i) <= 12) {
      bits[i] = "0";
    }
  }
  setRegister(rd, bits.join(""));
  return "";
}

function auipc(rd: string, imm: number, lineNumber: number): string{
  const bits: string[] = decimalToTwosComplement(imm).split("");
  for (let i = 0; i < XLEN; i++) {
    if ((XLEN - i) <= 12) {
      bits[i] = "0";
    }
  }
  const result: string = binaryAdd(bits.join(""), decimalToTwosComplement(imm));
  setRegister(rd, result);
  return "";
}

function add(rd: string, rs1: string, rs2: string): string {
  const rs1Value: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  const rs2Value: string = registers.get(STRINGS_TO_REGISTERS.get(rs2)!)!;
  const sumValue: string = binaryAdd(rs1Value, rs2Value);
  setRegister(rd, signExtend(sumValue));
  return "";
}

function sub(rd: string, rs1: string, rs2: string): string {
  const rs1Value: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  const rs2Value: string = registers.get(STRINGS_TO_REGISTERS.get(rs2)!)!;
  const subValue: string = binarySub(rs1Value, rs2Value);
  setRegister(rd, signExtend(subValue));
  return "";
}

function slt(rd: string, rs1: string, rs2: string): string {
  const rs1Value: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  const rs2Value: string = registers.get(STRINGS_TO_REGISTERS.get(rs2)!)!;
  setRegister(rd, zeroExtend(String(twosComplementToDecimal(rs1Value) < twosComplementToDecimal(rs2Value))));
  return "";
}
function sltu(rd: string, rs1: string, rs2: string): string {
  const rs1Value: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  const rs2Value: string = registers.get(STRINGS_TO_REGISTERS.get(rs2)!)!;
  setRegister(rd, zeroExtend(String(parseInt(rs1Value) < parseInt(rs1Value))));
  return "";
}

function sll(rd: string, rs1: string, rs2: string): string {
  console.log("Called the sll function.");
  return "";
}

function srl(rd: string, rs1: string, rs2: string): string {
  console.log("Called the srl function.");
  return "";
}



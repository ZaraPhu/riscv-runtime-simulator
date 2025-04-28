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
   * @param binVal - The binary string to convert (should be a multiple of 4 bits)
   * @returns The hexadecimal representation of the input binary string
   */
  let hexVal = "";
  for (let i = 0; i < binVal.length; i += 4) {
    hexVal += parseInt(binVal.substring(i, i + 4), 2).toString(Base.HEXADECIMAL);
  }
  return hexVal;
}

function binaryToOctal(binVal: string): string {
  /**
   * Converts a binary string to its octal representation.
   *
   * @param binVal - The binary string to convert
   * @returns The octal representation of the input binary string (3 bits per octal digit)
   */
  let octVal = "";
  const binValCleaned: string = binVal.padStart(Math.ceil(binVal.length / 3) * 3, "0");
  for (let i = 0; i < binVal.length; i += 3) {
    const octDigit = parseInt(binValCleaned.substring(i, i + 3), 2).toString(Base.OCTAL);
    octVal += octDigit;
  }
  return octVal;
}

function zeroExtend(bits: string): string { 
  /**
   * Extends a binary string to XLEN bits by padding with zeros on the left.
   * Used for unsigned values where the most significant bits should be filled with zeros.
   * 
   * @param bits - The binary string to extend
   * @returns A binary string padded with leading zeros to reach XLEN bits
   */
  return bits.padStart(XLEN, "0");
}

function signExtend(bits: string): string { 
  /**
   * Extends a binary string to XLEN bits by padding with the sign bit (leftmost bit) on the left.
   * Used for signed values to preserve the sign when extending the bit width.
   * 
   * @param bits - The binary string to extend (first bit is the sign bit)
   * @returns A binary string sign-extended to XLEN bits
   */
  return bits.padStart(XLEN, bits.charAt(0))
}

function decimalToTwosComplement(val: number, numDigits: number): string {
  /**
   * Converts a decimal number to its two's complement binary representation.
   *
   * This function handles both positive and negative numbers:
   * - For positive numbers, it returns the binary representation padded to totalDigits
   * - For negative numbers, it calculates the two's complement by:
   *   1. Taking the absolute value of the number
   *   2. Converting to binary and padding
   *   3. Inverting all bits (1s become 0s and vice versa)
   *   4. Adding 1 to the result
   *
   * @param val - The decimal number to convert
   * @param totalDigits - The total number of bits in the resulting binary string
   * @returns A binary string representation in two's complement format
   * @assumption -2^(totalDigits) <= val < 2^(totalDigits - 1)
   */

  // Handle positive numbers directly - just return binary representation
  if (val >= 0) {
    return val.toString(2).padStart(numDigits, "0");
  }

  // --- STEP 1: Get absolute value and convert to binary ---
  const absVal: number = Math.abs(val);
  const bits: string = absVal.toString(2).padStart(numDigits, "0");

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
   * - For negative numbers (MSB = 1), it performs two's complement conversion:
   *   1. Inverting all bits
   *   2. Converting the inverted binary to decimal
   *   3. Negating the result and adjusting by subtracting 2^XLEN
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

function binaryAdd(op1: string, op2: string): string {
  /**
   * Performs a binary addition of two binary strings.
   *
   * This function simulates the process of adding two binary numbers together
   * the same way it would be done by hand, processing each bit position from
   * right to left and tracking the carry.
   *
   * @param op1 - First binary string operand
   * @param op2 - Second binary string operand
   * @returns The binary sum of the two operands as a string
   */

  // Initialize carry bit and result string
  let carry: number = 0;
  let sum: string = "";

  // Determine the maximum length and pad both operands to the same length
  const len: number = Math.max(op1.length, op2.length);
  op1 = op1.padStart(len, "0");
  op2 = op2.padStart(len, "0");

  // Process each bit from right to left (least to most significant bit)
  for (let i = len - 1; i >= 0; i--) {
    // Get the bits at the current position
    let num1: string = op1[i];
    let num2: string = op2[i];

    // Calculate the current bit of the result
    // If the sum of the two bits plus the carry is even, the result bit is 0
    // Otherwise, the result bit is 1
    let decSum: number = parseInt(num1) + parseInt(num2) + Number(carry);
    sum = (decSum % 2 == 0 ? "0" : "1") + sum;

    // Calculate the carry for the next position
    // If the sum of the two bits plus the carry is 2 or greater, the carry is 1
    // Otherwise, the carry is 0
    carry = decSum >= 2 ? 1 : 0;
  }
  return sum;
}

function setRegisterBase(base: number) { 
  /**
   * Sets the base for register value display (binary, octal, decimal, or hexadecimal).
   * 
   * @param base - The numeric base to use for register display (2, 8, 10, or 16)
   * @returns void - Updates the global registerBase variable
   */
  registerBase = [Base.BINARY, Base.OCTAL, Base.DECIMAL, Base.HEXADECIMAL].includes(base) ? base : Base.DECIMAL;
}

function updateRegisterDisplays() { 
  /**
   * Updates all register displays with current values in the selected base format.
   * Displays register values with appropriate prefix:
   * - Binary: 0b prefix
   * - Octal: 0o prefix
   * - Hexadecimal: 0x prefix
   * - Decimal: no prefix (shows value in two's complement)
   * 
   * @returns void - Modifies the DOM elements directly
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

function setRegister(rd: string, val: string, extendFunc: Function = signExtend): boolean {
  /**
   * Sets a value to a specific register in the RISC-V register file.
   * 
   * If the target register is x0, the value will always be set to 0 as per RISC-V spec.
   * For all other registers, the provided value will be extended to XLEN bits
   * using the provided extension function (sign extension by default).
   *
   * @param rd - The destination register name (e.g., "x0", "sp", "a0")
   * @param val - The binary string value to set in the register
   * @param extendFunc - Function to extend the binary value to XLEN bits (defaults to signExtend)
   * @returns true if the register was successfully set, false if the input value had invalid length
   * @throws Error if the register name is not found in STRINGS_TO_REGISTERS map
   */

  if (val.length != XLEN) { 
    console.error(`Invalid register value length: ${val.length} != ${XLEN}`);
    return false;
  }

  // Convert register name to register number
  const register: number = STRINGS_TO_REGISTERS.get(rd)!;
  let valCleaned: string = extendFunc(((register == 0) ? "0" : val));

  // register values are always stored as binary strings
  registers.set(register, valCleaned);

  updateRegisterDisplays();
  return true;
}

function zeroAllRegisters() { 
  /**
   * Resets all registers to zero.
   * 
   * This function iterates through all registers in the RISC-V register file,
   * including the program counter (PC), and sets their values to zero.
   * It's used to initialize or reset the register state before program execution.
   */
  for (let i: number = 0; i < XLEN + 1; i++) { 
    registers.set(i, zeroExtend("0"));
  }
  updateRegisterDisplays();
}

function addi(rd: string, rs1: string, imm: number): boolean {
  /**
   * Implements the ADDI instruction (Add Immediate).
   * Adds a 12-bit signed immediate value to the value in the source register,
   * and stores the result in the destination register.
   * If the immediate value exceeds the 12-bit signed range (-4096 to 4095),
   * it will be truncated to fit within this range.
   * The result is capped at 2^31-1 to prevent overflow.
   *
   * @param rd - The destination register name (e.g., "x1", "t0")
   * @param rs1 - The source register name containing the base value
   * @param imm - The immediate value to add (will be truncated to 12-bit signed if needed)
   * @returns true if the operation was successful, false if trying to modify register x0 (which is hardwired to 0)
   */

  const sourceValue: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  const binarySum: string = binaryAdd(sourceValue, decimalToTwosComplement(imm, XLEN));
  return setRegister(rd,binarySum);
}

function slti(rd: string, rs1: string, imm: number): boolean {
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
  const sourceValue: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  // sign extending a 12 bit immediate value to XLEN bits is just a two's complement representation
  return setRegister(rd, (twosComplementToDecimal(sourceValue) < imm) ? "1" : "0");
}

function sltiu(rd: string, rs1: string, imm: number): boolean {
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
  const sourceValue: string = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  const immUnsigned: number = twosComplementToDecimal(zeroExtend(decimalToTwosComplement(imm, 12)));
  return setRegister(rd, (twosComplementToDecimal(sourceValue) < immUnsigned) ? "1" : "0");
}

function andi(rd: string, rs1: string, imm: number): boolean {
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
  return setRegister(rd, result.join(""));
}

function ori(rd: string, rs1: string, imm: number): boolean {
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
  return setRegister(rd, result.join(""));
}

function xori(rd: string, rs1: string, imm: number): boolean {
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
  return setRegister(rd, result.join(""));
}

function slli(rd: string, rs1: string, imm: number): boolean {
  console.log("Called slli function.");
  return false;
}
function srli(rd: string, rs1: string, imm: number): boolean {
  console.log("Called srli function.");
  return false;
}

function srai(rd: string, rs1: string, imm: number): boolean {
  console.log("Called srai function.");
  return false;
}

function lui(rd: string, imm: number): boolean {
  console.log("Called lui function.");
  return false;
}

function auipc(rd: string, imm: number): boolean {
  console.log("Called auipc function.");
  return false;
}

function add(rd: string, rs1: string, rs2: string): boolean {
  console.log("Called the add function.");
  return false;
}

function sub(rd: string, rs1: string, rs2: string): boolean {
  console.log("Called the sub function.");
  return false;
}

function slt(rd: string, rs1: string, rs2: string): boolean {
  console.log("Called the slt function.");
  return false;
}
function sltu(rd: string, rs1: string, rs2: string): boolean {
  console.log("Called the sltu function.");
  return false;
}

function sll(rd: string, rs1: string, rs2: string): boolean {
  console.log("Called the sll function.");
  return false;
}

function srl(rd: string, rs1: string, rs2: string): boolean {
  console.log("Called the srl function.");
  return false;
}



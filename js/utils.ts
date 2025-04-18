/*
This file is used to hold the helper functions for the runtime simulator script.
It carries out the assembly instructions. It also holds important constants which
are used in the runtime simulator.
Author: Zara Phukan.
Creation Date: April 15, 2025.
*/

/*** Constants ***/
const registerDisplays: HTMLParagraphElement[] = [];
for (let i = 0; i < XLEN; i++) {
  registerDisplays.push(document.querySelector(`#register-${i}`)!);
}
registerDisplays.push(document.querySelector("#pc-register")!);

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

const U_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function> = new Map([
  ["LUI", lui],
  ["AUIPC", auipc],
]);

const R_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function> = new Map([
  ["ADD", add],
  ["SUB", sub],
  ["SLT", slt],
  ["SLTU", sltu],
  ["SLL", sll],
  ["SRL", srl],
]);

const NONE_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function> = new Map([
  ["NOP", () => {}],
]);

/*** Functions ***/
function binaryToHex(binVal: string) : string {
  /**
   * Converts a binary string to its hexadecimal representation.
   * 
   * @param binVal - The binary string to convert (should be a multiple of 4 bits)
   * @returns The hexadecimal representation of the input binary string
   */
  let hexVal = "";
  for (let i = 0; i < binVal.length; i += 4) {
    hexVal += parseInt(binVal.substring(i, i + 4), 2).toString(16);
  }
  return hexVal;
}

function hexToBinary(hexVal: string) : string {
  /**
   * Converts a hexadecimal string to its binary representation.
   * 
   * @param hexVal - The hexadecimal string to convert
   * @returns The binary representation of the input hexadecimal string (4 bits per hex digit)
   */
  let binVal = "";
  for (let i = 0; i < hexVal.length; i++) {
    const binDigit = parseInt(hexVal[i], 16).toString(2).padStart(4, '0');
    binVal += binDigit;
  }
  return binVal;
}

function twosComplement(val: number, totalDigits: number) : string {
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
    return val.toString(2).padStart(totalDigits, "0");
  }

  // --- STEP 1: Get absolute value and convert to binary ---
  const absVal: number = Math.abs(val);
  const bits: string = absVal.toString(2).padStart(totalDigits, "0");

  // --- STEP 2: Convert string to array and invert all bits ---
  let chars: string[] = [...bits];
  chars = chars.map(char => char === "0" ? "1" : "0");

  // --- STEP 3: Add one to the inverted result ---
  let carry = 1;
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] === "1") {
      chars[i] = "0";
    } else {
      chars[i] = "1";
      carry = 0;
      break;
    }
  }

  // --- STEP 4: Handle any remaining carry and ensure proper length ---
  if (carry === 1) {
    chars.unshift("1");  // Add a new digit if we still have a carry
  } else { 
    chars.unshift("0");  // Otherwise pad with leading zero
  }

  // --- STEP 5: Return the result at the correct length ---
  return chars.join("").slice(-totalDigits);
}

function binaryAdd(op1: string, op2: string) : string {
  let carry: number = 0;
  let result: string = "";
  const len: number = Math.max(op1.length, op2.length);
  op1.padStart(len, "0");
  op2.padStart(len, "0");
  
  for (let i = len - 1; i >= 0; i++) { 
    let num1: string = op1[i];
    let num2: string = op2[i];
    carry = ((carry + parseInt(num1) + parseInt(num2)) >= 2) ? 1 : 0;
    result = (parseInt(num1) ^ parseInt(num2) ? "1" + result;
  }
}

function setNumHexDigits(val: number, totalDigits: number): string { 
  return val.toString(16).padStart(totalDigits, '0').slice(-totalDigits);
}

function setNumBinaryDigits(val: number, totalDigits: number): string { 
  const zeros: string = "0".repeat(Math.max(totalDigits - val.toString(2).length, 0));
  return `${zeros}${val.toString(2).slice(-totalDigits)}`;
}


function setRegister(rd: string, val: number): boolean {
  /**
   * Sets a value to a specific register.
   *
   * @param rd - The destination register name (e.g., "x0", "sp", "a0")
   * @param val - The value to set in the register
   * @returns true if the register was successfully set, false if trying to modify register x0 (which is hardwired to 0)
   */
  const register: number = STRINGS_TO_REGISTERS.get(rd)!;
  if (register == 0) {
    raiseError("Cannot modify register x0");
    return false;
  } 
  registers.set(register, val);
  registerDisplays.forEach((register_i, i) => {
    const registerHex: number = registers.get(i)!;
    // TODO: route to either the hex or binary option depending option
    // what the user chooses
    register_i.textContent = `0x${setNumHexDigits(registerHex, 8)}`;
  });
  return true;
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
  if ((imm < -4096) || (imm > 4095)) { 
    raiseError("Immediate value out of 12-bit signed range.");
    return false;
  }
  const sourceValue: number = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  let sum = Number(sourceValue) + Number(imm);
  return setRegister(rd, sum);
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
  const sourceValue: number = registers.get(STRINGS_TO_REGISTERS.get(rs1)!)!;
  return setRegister(rd, Number(sourceValue) < Number(imm) ? 1 : 0);
}

function sltiu(rd: string, rs1: string, imm: number): boolean {
  const sourceRegister: number = STRINGS_TO_REGISTERS.get(rs1)!;
  return setRegister(
    rd,
    Number(registers.get(sourceRegister)!) < Number(imm) ? 1 : 0,
  );
}

function andi(rd: string, rs1: string, imm: number): boolean {
  console.log("Called andi function.");
  return false;
}
function ori(rd: string, rs1: string, imm: number): boolean {
  console.log("Called ori function.");
  return false;
}
function xori(rd: string, rs1: string, imm: number): boolean {
  console.log("Called xori function.");
  return false;
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

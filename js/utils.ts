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
function setNumHexDigits(val: number, totalDigits: number): string { 
  const zeros: string = "0".repeat(Math.max(totalDigits - val.toString(16).length, 0));
  return `0x${zeros}${val.toString(16).slice(-totalDigits)}`;
}

function setNumBinaryDigits(val: number, totalDigits: number): string { 
  const zeros: string = "0".repeat(Math.max(totalDigits - val.toString(2).length, 0));
  return `0b${zeros}${val.toString(2).slice(-totalDigits)}`;
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
  if (register != 0) {
    registers.set(register, val);
    registerDisplays.forEach((register_i, i) => {
      const registerHex: number = registers.get(i)!;
      register_i.textContent = `0x${setNumHexDigits(registerHex, 8)}`;
    });
    return true;
  } else {
    return false;
  }
}

function addi(rd: string, rs1: string, imm: number): boolean {
  /**
   * Implements the ADDI instruction (Add Immediate).
   * Adds an immediate value to the source register and stores the result in the destination register.
   *
   * @param rd - The destination register name
   * @param rs1 - The source register name
   * @param imm - The immediate value to add
   * @returns true if the operation was successful, false if trying to modify register x0
   */
  if ((imm >= 4096) || (imm <= -4095)) { 
    console.log("Immediate value out of range. It will be truncated to its lower 12 bits.");
    return false;
  }
  const sourceValue: string = setNumHexDigits(, totalDigits)
  /*
  const sourceValue: string = STRINGS_TO_REGISTERS.get(rs1)!.toString(16).slice(-7);
  const immValue: string = `${0.repeat()} ${imm.toString(16)} `; 
  return setRegister(rd, Number(registers.get(sourceRegister)!) + Number(imm));
  */
  return false;
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
  console.log("Called slti function.");
  const sourceRegister: number = STRINGS_TO_REGISTERS.get(rs1)!;
  return setRegister(
    rd,
    Number(registers.get(sourceRegister)!) < Number(imm) ? 1 : 0,
  );
}

function sltiu(rd: string, rs1: string, imm: number): boolean {
  console.log("Called sltiu function.");
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

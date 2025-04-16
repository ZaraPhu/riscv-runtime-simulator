/*
This file is used to hold the helper functions for the runtime simulator script.
It carries out the assembly instructions. It also holds important constants which
are used in the runtime simulator.
Author: Zara Phukan.
Creation Date: April 15, 2025.
*/

// custom enum for stating instruction format
enum OperandType {
  IMMEDIATE,
  REGISTER,
}

interface InstructionObject {
  instruction: CallableFunction;
  type: OperandType[];
  operands: string[];
}

/*** Constants ***/
const I_TYPE: OperandType[] = [
  OperandType.REGISTER,
  OperandType.REGISTER,
  OperandType.IMMEDIATE,
];
const U_TYPE: OperandType[] = [OperandType.REGISTER, OperandType.IMMEDIATE];
const R_TYPE: OperandType[] = [
  OperandType.REGISTER,
  OperandType.REGISTER,
  OperandType.REGISTER,
];
const NONE_TYPE: OperandType[] = [];
const PSEUDO_TYPE: OperandType[] = [OperandType.REGISTER, OperandType.REGISTER];
const J_TYPE: OperandType[] = [];

// for storing the current values in the registers
const registers: Map<number, number> = new Map(
  Array.from({ length: 33 }, (_, i) => [i, 0x00000000]),
);

const STRINGS_TO_REGISTERS: ReadonlyMap<string, number> = new Map([
  // General Register Names
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
  ["pc", 32],
  // ABI Register Names
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
  ["pc", 32],
]);

const INSTRUCTION_TO_FORMAT: ReadonlyMap<string, OperandType[]> = new Map([
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

const INSTRUCTION_TO_CALLBACK: ReadonlyMap<string, CallableFunction> = new Map([
  ["ADDI", addi],
]);

/*** Functions ***/
function setRegister(rd: string, val: number): boolean {
  const register: number | undefined = STRINGS_TO_REGISTERS.get(rd)!;
  if (register != 0) {
    registers.set(register, val);
    return true;
  } else {
    return false;
  }
}

function addi(rd: string, rs1: string, imm: number): boolean {
  const sourceRegister: number = STRINGS_TO_REGISTERS.get(rs1)!;
  return setRegister(rd, registers.get(sourceRegister)! + imm);
}

function slti(rd: string, rs1: string, imm: number): boolean {
  const sourceRegister: number = STRINGS_TO_REGISTERS.get(rs1)!;
  return setRegister(rd, (registers.get(sourceRegister)! < imm) ? 1 : 0);
}

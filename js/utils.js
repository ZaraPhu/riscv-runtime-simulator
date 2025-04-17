"use strict";
/*
This file is used to hold the helper functions for the runtime simulator script.
It carries out the assembly instructions. It also holds important constants which
are used in the runtime simulator.
Author: Zara Phukan.
Creation Date: April 15, 2025.
*/
// custom enum for stating instruction format
var OperandType;
(function (OperandType) {
    OperandType[OperandType["IMMEDIATE"] = 0] = "IMMEDIATE";
    OperandType[OperandType["REGISTER"] = 1] = "REGISTER";
})(OperandType || (OperandType = {}));
/*** Constants ***/
const registerDisplays = [];
for (let i = 0; i < XLEN; i++) {
    registerDisplays.push(document.querySelector(`#register-${i}`));
}
registerDisplays.push(document.querySelector("#pc-register"));
const I_TYPE = [
    OperandType.REGISTER,
    OperandType.REGISTER,
    OperandType.IMMEDIATE,
];
const U_TYPE = [OperandType.REGISTER, OperandType.IMMEDIATE];
const R_TYPE = [
    OperandType.REGISTER,
    OperandType.REGISTER,
    OperandType.REGISTER,
];
const NONE_TYPE = [];
const PSEUDO_TYPE = [OperandType.REGISTER, OperandType.REGISTER];
const J_TYPE = [];
// for storing the current values in the registers
const registers = new Map(Array.from({ length: 33 }, (_, i) => [i, 0]));
const STRINGS_TO_REGISTERS = new Map([
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
    ["SRAI", srai]
]);
const U_INSTRUCTION_TO_FUNCTION = new Map([
    ["LUI", lui],
    ["AUIPC", auipc]
]);
const R_INSTRUCTION_TO_FUNCTION = new Map([
    ["ADD", add],
    ["SUB", sub],
    ["SLT", slt],
    ["SLTU", sltu],
    ["SLL", sll],
    ["SRL", srl]
]);
const NONE_INSTRUCTION_TO_FUNCTION = new Map([
    ["NOP", () => { }]
]);
/*** Functions ***/
function updateRegisterDisplays() {
    registerDisplays.forEach((register_i, i) => {
        const registerHex = registers.get(i).toString(16);
        const zeros = "0".repeat(Math.max((8 - registerHex.length), 0));
        register_i.textContent = `0x${zeros}${registerHex}`;
    });
}
function setRegister(rd, val) {
    /**
     * Sets a value to a specific register.
     *
     * @param rd - The destination register name (e.g., "x0", "sp", "a0")
     * @param val - The value to set in the register
     * @returns true if the register was successfully set, false if trying to modify register x0 (which is hardwired to 0)
     */
    const register = STRINGS_TO_REGISTERS.get(rd);
    if (register != 0) {
        registers.set(register, val);
        updateRegisterDisplays();
        return true;
    }
    else {
        return false;
    }
}
function addi(rd, rs1, imm) {
    /**
     * Implements the ADDI instruction (Add Immediate).
     * Adds an immediate value to the source register and stores the result in the destination register.
     *
     * @param rd - The destination register name
     * @param rs1 - The source register name
     * @param imm - The immediate value to add
     * @returns true if the operation was successful, false if trying to modify register x0
     */
    console.log("Called addi function.");
    const sourceRegister = STRINGS_TO_REGISTERS.get(rs1);
    return setRegister(rd, Number(registers.get(sourceRegister)) + Number(imm));
}
function slti(rd, rs1, imm) {
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
    const sourceRegister = STRINGS_TO_REGISTERS.get(rs1);
    console.log((Number(registers.get(sourceRegister)) < Number(imm)) ? 1 : 0);
    return setRegister(rd, (Number(registers.get(sourceRegister)) < Number(imm)) ? 1 : 0);
}
function sltiu(rd, rs1, imm) {
    console.log("Called sltiu function.");
    return false;
}
function andi(rd, rs1, imm) {
    console.log("Called andi function.");
    return false;
}
function ori(rd, rs1, imm) {
    console.log("Called ori function.");
    return false;
}
function xori(rd, rs1, imm) {
    console.log("Called xori function.");
    return false;
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

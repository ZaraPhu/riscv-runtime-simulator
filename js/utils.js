"use strict";
/*
This file is used to hold the helper functions for the runtime simulator script.
It carries out the assembly instructions. It also holds important constants which
are used in the runtime simulator.
Author: Zara Phukan.
Creation Date: April 15, 2025.
*/
/*** Constants ***/
const registerDisplays = [];
for (let i = 0; i < XLEN; i++) {
    registerDisplays.push(document.querySelector(`#register-${i}`));
}
registerDisplays.push(document.querySelector("#pc-register"));
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
/*** Functions ***/
function updateRegisterDisplays() {
    registerDisplays.forEach((register_i, i) => {
        const registerHex = registers.get(i).toString(16).slice(-7);
        const zeros = "0".repeat(Math.max(8 - registerHex.length, 0));
        register_i.textContent = `0x${zeros}${registerHex}`;
    });
}
function setLeadingHexDigits(val, totalDigits) {
    const zeros = "0".repeat(Math.max(totalDigits - val.toString(16).length, 0));
    return `0x${zeros}${val.toString(16).slice(-totalDigits)}`;
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
    if ((imm >= 4096) || (imm <= -4095)) {
        console.log("Immediate value out of range");
    }
    /*
    const sourceValue: string = STRINGS_TO_REGISTERS.get(rs1)!.toString(16).slice(-7);
    const immValue: string = `${0.repeat()} ${imm.toString(16)} `;
    return setRegister(rd, Number(registers.get(sourceRegister)!) + Number(imm));
    */
    return false;
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
    return setRegister(rd, Number(registers.get(sourceRegister)) < Number(imm) ? 1 : 0);
}
function sltiu(rd, rs1, imm) {
    console.log("Called sltiu function.");
    const sourceRegister = STRINGS_TO_REGISTERS.get(rs1);
    return setRegister(rd, Number(registers.get(sourceRegister)) < Number(imm) ? 1 : 0);
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

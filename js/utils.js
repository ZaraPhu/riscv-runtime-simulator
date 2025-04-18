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
function twosComplement(val, totalDigits) {
    // assuming that -2^(totalDigits) <= val < 2^(totalDigits - 1)
    if (val < 0) {
        const absVal = Math.abs(val);
        const bits = absVal.toString(2).padStart(totalDigits, "0");
        console.log(bits);
        let chars = [...bits];
        chars = chars.map(char => char === "0" ? "1" : "0");
        // now need to add one to it
        console.log(chars);
        let carry = 1;
        for (let i = chars.length - 1; i >= 0; i--) {
            if (chars[i] === "1") {
                chars[i] = "0";
            }
            else {
                chars[i] = "1";
                carry = 0;
                break;
            }
        }
        console.log(carry);
        console.log(chars);
        if (carry === 1) {
            chars.unshift("1");
        }
        else {
            chars.unshift("0");
        }
        console.log(chars.join("").slice(-totalDigits));
        return chars.join("").slice(-totalDigits);
    }
    else {
        return val.toString(2).padStart(totalDigits, "0");
    }
}
function setNumHexDigits(val, totalDigits) {
    return val.toString(16).padStart(totalDigits, '0').slice(-totalDigits);
}
function setNumBinaryDigits(val, totalDigits) {
    const zeros = "0".repeat(Math.max(totalDigits - val.toString(2).length, 0));
    return `${zeros}${val.toString(2).slice(-totalDigits)}`;
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
    if (register == 0) {
        raiseError("Cannot modify register x0");
        return false;
    }
    registers.set(register, val);
    registerDisplays.forEach((register_i, i) => {
        const registerHex = registers.get(i);
        // TODO: route to either the hex or binary option depending option
        // what the user chooses
        register_i.textContent = `0x${setNumHexDigits(registerHex, 8)}`;
    });
    return true;
}
function addi(rd, rs1, imm) {
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
    const sourceValue = registers.get(STRINGS_TO_REGISTERS.get(rs1));
    let sum = Number(sourceValue) + Number(imm);
    return setRegister(rd, sum);
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
    const sourceValue = registers.get(STRINGS_TO_REGISTERS.get(rs1));
    return setRegister(rd, Number(sourceValue) < Number(imm) ? 1 : 0);
}
function sltiu(rd, rs1, imm) {
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

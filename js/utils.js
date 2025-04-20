"use strict";
/*
This file is used to hold the helper functions for the runtime simulator script.
It carries out the assembly instructions. It also holds important constants which
are used in the runtime simulator.
Author: Zara Phukan.
Creation Date: April 15, 2025.
*/
/*** Constants ***/
// registerDisplays which is an array of all the register display elements
const registerDisplays = [];
for (let i = 0; i < XLEN; i++) {
    registerDisplays.push(document.querySelector(`#register-${i}`));
}
registerDisplays.push(document.querySelector("#pc-register"));
// I_INSTRUCTION_TO_FUNCTION is a map of all the I-type instructions to their corresponding functions
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
// U_INSTRUCTION_TO_FUNCTION is a map of all the U-type instructions to their corresponding functions
const U_INSTRUCTION_TO_FUNCTION = new Map([
    ["LUI", lui],
    ["AUIPC", auipc],
]);
// R_INSTRUCTION_TO_FUNCTION is a map of all the R-type instructions to their corresponding functions
const R_INSTRUCTION_TO_FUNCTION = new Map([
    ["ADD", add],
    ["SUB", sub],
    ["SLT", slt],
    ["SLTU", sltu],
    ["SLL", sll],
    ["SRL", srl],
]);
// NONE_INSTRUCTION_TO_FUNCTION is a map of all the none-type instructions to their corresponding functions
const NONE_INSTRUCTION_TO_FUNCTION = new Map([
    ["NOP", () => { }],
]);
/*** Functions ***/
function binaryToHex(binVal) {
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
function hexToBinary(hexVal) {
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
function binaryToOctal(binVal) {
    /**
     * Converts a binary string to its octal representation.
     *
     * @param binVal - The binary string to convert
     * @returns The octal representation of the input binary string (3 bits per octal digit)
     */
    let octVal = "";
    for (let i = 0; i < binVal.length; i += 3) {
        const octDigit = parseInt(binVal.substring(i, i + 3), 2).toString(8);
        octVal += octDigit;
    }
    return octVal;
}
function octalToBinary(octVal) {
    /**
     * Converts an octal string to its binary representation.
     *
     * @param octVal - The octal string to convert
     * @returns The binary representation of the input octal string (3 bits per octal digit)
     */
    let binVal = "";
    for (let i = 0; i < octVal.length; i++) {
        const binDigit = parseInt(octVal[i], 8).toString(2).padStart(3, '0');
        binVal += binDigit;
    }
    return binVal;
}
function twosComplement(val, totalDigits) {
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
    const absVal = Math.abs(val);
    const bits = absVal.toString(2).padStart(totalDigits, "0");
    // --- STEP 2: Convert string to array and invert all bits ---
    let chars = [...bits];
    chars = chars.map(char => char === "0" ? "1" : "0");
    // --- STEP 3: Add one to the inverted result ---
    for (let i = chars.length - 1; i >= 0; i--) {
        if (chars[i] === "1") {
            chars[i] = "0";
        }
        else {
            chars[i] = "1";
            break;
        }
    }
    // --- STEP 4: Return the result at the correct length ---
    return chars.join("").slice(-totalDigits);
}
function binaryAdd(op1, op2) {
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
    let carry = 0;
    let result = "";
    // Determine the maximum length and pad both operands to the same length
    const len = Math.max(op1.length, op2.length);
    op1 = op1.padStart(len, "0");
    op2 = op2.padStart(len, "0");
    // Process each bit from right to left (least to most significant bit)
    for (let i = len - 1; i >= 0; i--) {
        // Get the bits at the current position
        let num1 = op1[i];
        let num2 = op2[i];
        // Calculate the current bit of the result
        // If the sum of the two bits plus the carry is even, the result bit is 0
        // Otherwise, the result bit is 1
        result = ((parseInt(num1) + parseInt(num2) + Number(carry) % 2 == 0) ? "0" : "1") + result;
        // Calculate the carry for the next position
        // If the sum of the two bits plus the carry is 2 or greater, the carry is 1
        // Otherwise, the carry is 0
        carry = ((carry + parseInt(num1) + parseInt(num2)) >= 2) ? 1 : 0;
    }
    return result;
}
function setRegister(rd, val, base) {
    /**
     * Sets a value to a specific register.
     *
     * @param rd - The destination register name (e.g., "x0", "sp", "a0")
     * @param val - The value to set in the register
     * @returns true if the register was successfully set, false if trying to modify register x0 (which is hardwired to 0)
     */
    // Convert register name to register number
    const register = STRINGS_TO_REGISTERS.get(rd);
    // Register x0 is hardwired to 0 and cannot be modified
    if (register == 0) {
        raiseError("Cannot modify register x0 (hardwired to 0).");
        return false;
    }
    // Set the register value in our register file
    if (base == 2) {
        registers.set(register, `0b${val.padStart(XLEN, "0")}`);
    }
    else if (base == 8) {
        registers.set(register, `0o${val.padStart(XLEN / 3, "0")}`);
    }
    else if (base == 16) {
        registers.set(register, `0x${val.padStart(XLEN / 4, "0")}`);
    }
    else {
        registers.set(register, `${val.padStart(XLEN / 2, "0")}`);
    }
    registerDisplays[register].textContent = registers.get(register);
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
        raiseError("Immediate value outside of 12-bit signed range.");
        return false;
    }
    const sourceValue = registers.get(STRINGS_TO_REGISTERS.get(rs1));
    const binarySum = binaryAdd(sourceValue, twosComplement(imm, XLEN));
    return setRegister(rd, Number(binarySum).toString(16).padStart(XLEN / 4, "0"), 16);
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
    return false;
    /*
    return setRegister(rd, Number(sourceValue) < Number(imm) ? 1 : 0,);
    */
}
function sltiu(rd, rs1, imm) {
    const sourceRegister = STRINGS_TO_REGISTERS.get(rs1);
    return false;
    /*
    return setRegister(
      rd,
      Number(registers.get(sourceRegister)!) < Number(imm) ? 1 : 0,
    );
    */
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

# riscv-runtime-simulator
## Purpose
This is the source code reposity for my (Zara's) implementation of a RISC-V Runtime Simulator. The source code is stored here for anybody to be able to modify and use, available under the GPLv3 license.

## Guide for Beginners
### Overview
This RISC-V "Runtime Simulator" is a web app currently deployed at [zarafoo.com](https://www.zarafoo.com). RISC-V (pronounced "risk-five") refers to a set of instructions for CPUs, and this instruction set defines how the CPU carries out operations to make a computer run. "RISC" stands for "Reduced Instruction Set Computing", and it's considered "Reduced" because it defines a very simple set of instructions that can be carried out by the CPU compared to instruction sets like x86.

The special quality of RISC-V is that it is an open standard, meaning that there are no royalties to pay or proprietary licenses to obtain in order to use it.

The three big things to consider in this runtime simulator are
1. the Register File
2. the Assembly Editor
3. the Memory Peeker

### The Register File
On the leftmost panel, you'll notice a list of "registers". Registers are places you can store data, and they're stored in the form of 32-bit numbers (meaning, that they are each a sequence of 32 0's and 1's). In the background, all of the operations carried out with the data in the registers are done in binary, but you can select different ways of viewing the data using the "Binary", "Octal", "Decimal", and "Hexadecimal" representations.

The "Reset Registers" button simply resets all the registers to be equal to all zeros.

You can see there are 33 registers in total, with each register having a unique label next to it. When you are writing the assembly code, you will use these labels so you can refer to specific registers when you need to. Note that the "x0" register is hardwired to be always 0.

### Instruction List
A number of instructions from RISC-V have already been implemented in this runtime simulator. You'll find a table below of instructions and their corresponding formats:
- ADDI rd, rs, imm (add the value in register "rs" to the number "imm", and store the result inside register "rd")
- SLTI rd, rs, imm (store 1 in register "rd" if the value in "rs" is less than the number "imm", otherwise store 0 in register "rd")
- SLTIU rd, rs, imm (store 1 in register "rd" if the value in "rs" is less than the zero extended number "imm", otherwise store 0 in register "rd")
- ANDI (compute the bitwise AND between the value in register "rs" and the number "imm", and store the result in register "rd")
- ORI (compute the bitwise OR between the value in register "rs" and the number "imm", and store the result in register "rd")
- XORI (compute the bitwise OR between the value in register "rs" and the number "imm", and store the result in register "rd")
- SLLI rd, rs, imm (compute the left bit shift of the value in register "rs" by "imm" bits and store the result in register "rd")
- SRLI rd, rs, imm (compute the right bit shift of the value in register "rs" by "imm" bits and store the result in register "rd")
- SRAI rd, rs, imm (compute the right bit rotation of the value in register "rs" by "imm" bits and store the result in register "rd")
- LUI rd, imm ()
- AUIPC rd, imm ()
- MV rd, rs (move the value in register "rs" into register "rd")
- SEQZ rd, rs (store 1 in register "rd" if the value in register "rs" is zero, otherwise store 0 in register "rd")
- ADD rd, rs1, rs2 (add the values stored in register "rs1" and "rs2", and store the result in register "rd")
- SUB rd, rs1, rs2 (subtract the value in register "rs1" from the value in "rs2" and store the result in register "rd")

Legend:
- rd - destination register
- rs/rs1/rs2: source register(s)
- imm - immediate value (a number)

### The Memory Peeker
Currently, the Memory Peeker has not been implemented. When it is ready, this component will display the binary (machine code) representation of the instructions. 

## An Example Program
Consider the following program
```
ADDI x1, x0, 5
ADDI x2, x0, 3
SUB x3, x1, x2
```
Here is what this program does line by line:
1. Move the value of 5 (same as 5 + 0, since x0 is always 0) into register x1
2. Move the value of 3 into register x2
3. Store the result of 5 - 3 (x1 - x2) in register x3

## Appendix A: The RISC-V ISA
This runtime simulator will be trying to match the latest ratfound at ratified technical specifications for the [RISC-V ISA](https://lf-riscv.atlassian.net/wiki/spaces/HOME/pages/16154769/RISC-V+Technical+Specifications). I will begin by pouring through the

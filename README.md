# riscv-runtime-simulator
## Purpose
This is the source code reposity for my (Zara's) implementation of a RISC-V Runtime Simulator. The source code is stored here for anybody to be able to modify and use, available under the GPLv3 license.

## Guide for Beginners
### Overview
This RISC-V "Runtime Simulator" is a web app currently deployed at [zarafoo.com](https://zarafoo.com/). RISC-V (pronounced "risk-five") refers to a set of instructions for CPUs, and this instruction set defines how the CPU carries out operations to make a computer run. "RISC" stands for "Reduced Instruction Set Computing", and it's considered "Reduced" because it defines a very simple set of instructions that can be carried out by the CPU compared to instruction sets like x86.

The special quality of RISC-V is that it is an open standard, meaning that there are no royalties to pay or proprietary licenses to obtain in order to use it.

The three big things to consider in this runtime simulator are
1. the Register File
2. the Assembly Editor
3. the Memory Peeker

### The Register File
On the leftmost panel, you'll notice a list of "registers". Registers are places you can store data, and they're stored in the form of 32-bit numbers (meaning, that each register holds a sequence of 32 0's and 1's). In the background, all of the operations carried out with the data in the registers are done in binary, but you can select different ways of viewing the data using the "Binary", "Octal", "Decimal", and "Hexadecimal" representations.

The "Reset Registers" button simply resets all the registers to be equal to all zeros.

You can see there are 33 registers in total, with each register having a unique label next to it. When you are writing the assembly code, you will use these labels so you can refer to specific registers when you need to. Note that the "x0" register is hardwired to be always 0.

### Instruction List
A number of instructions from RISC-V have already been implemented in this runtime simulator. You'll find a table below of instructions and their corresponding formats:
- ADDI rd, rs, imm (add the value in register "rs" to the number "imm", and store the result inside register "rd")
- MV rd, rs (move the value in register "rs" into register "rd")
- SLTI rd, rs, imm (store 1 in register "rd" if the value in "rs" is less than the number "imm", otherwise store 0 in register "rd")
- SLTIU rd, rs, imm (store 1 in register "rd" if the value in "rs" is less than the zero extended number "imm", otherwise store 0 in register "rd")
- SEQZ rd, rs (store 1 in register "rd" if the value in register "rs" is zero, otherwise store 0 in register "rd")
- ANDI (compute the bitwise AND between the value in register "rs" and the number "imm", and store the result in register "rd")
- ORI (compute the bitwise OR between the value in register "rs" and the number "imm", and store the result in register "rd")
- XORI (compute the bitwise OR between the value in register "rs" and the number "imm", and store the result in register "rd")
- SLLI rd, rs, imm (compute the left bit shift of the value in register "rs" by "imm" bits and store the result in register "rd")
- SRLI rd, rs, imm (compute the right bit shift of the value in register "rs" by "imm" bits and store the result in register "rd")
- SRAI rd, rs, imm (compute the right bit rotation of the value in register "rs" by "imm" bits and store the result in register "rd")
- LUI rd, imm (load the upper 20 bits of the number "imm" in binary representation into the upper 20 bits of register "rd", and set the lower 12 bits of register "rd" to 0)
- AUIPC rd, imm ()
- ADD rd, rs1, rs2 (add the values stored in register "rs1" and "rs2", and store the result in register "rd")
- SUB rd, rs1, rs2 (subtract the value in register "rs1" from the value in "rs2" and store the result in register "rd")
- 

Legend:
- rd - destination register
- rs/rs1/rs2: source register(s)
- imm - immediate value (a number)

### The Memory Peeker
The Memory Peeker is on the right hand side of the screen. In the context of this runtime simulator, the "memory" refers to where the program instructions and programd data are stored (in binary form). 

Notice that when you press the "Assemble" button, this runtime simulator will erase the current memory cell values, convert the instructions you wrote in the assembly editor into 32-bit numbers, and store those numbers inside the memory cells in order. 


## An Example Program
Consider the following program
```
ADDI x1, x0, 5
ADDI x2, x0, 3
SUB x3, x1, x2
```
(You can copy and paste this straight into the "Assembly Editor" to follow along.)

First, you press the "Assemble" button. You'll notice that the numbers inside the memory peeker (on the right hand side of the screen) may have changed. For example, in memory cell 1, you'll see the number "00000000010100000000000010010011". This is a binary representation of the first instruction "ADDI x1, x0, 5". The following numbers below this are the rest of the instructions in their binary representation.

In a real computer, the assembly that you would write is turned into these numbers stored in the memory peeker. A computer doesn't directly understand the significance of the "ADDI x1, x0, 5" instruction, but it can deal with numbers!

Next, press the "Step" button. Notice that on the left hand side of the screen, there was a change in the numbers being stored in the registers. In register x1, you'll see the "0b00000000000000000000000000000101" next to it. This is just a binary representation of the number 5. When you press the "Step" button, the simulator carries out the instructions step-by-step.

The first instruction "ADDI x1, x0, 5" adds the number in register x0 (which is always 0 no matter what) to the number 5, and stores that result in register x1. The second instruction loads 3 into register x2. The final instruction performs subtract between the numbers in x2 and x1 (5 - 3, in this case), and stores that result inside register x3.

## Appendix A: The RISC-V ISA
This runtime simulator will be trying to match the latest ratified specification for the [RISC-V ISA](https://lf-riscv.atlassian.net/wiki/spaces/HOME/pages/16154769/RISC-V+Technical+Specifications). Specifically, this project implements the fully ratified R32I (Base Integer) ISA.

## Appendix B: SFU RISC-V Reference Card
The opcodes and other insutrction decoding information is borrowed from the reference card from [SFU's RISC-V Reference Card](https://www.cs.sfu.ca/~ashriram/Courses/CS295/assets/notebooks/RISCV/RISCV_CARD.pdf).

# riscv-runtime-simulator

This is the source code reposity for my (Zara's) implementation of a RISC-V Runtime Simulator. The source code is stored here for anybody to be able to modify and use. T

## Goals
1. Create a basic template for the content layer of the webpage to display the RISC-V assembly editor, the memory viewer, and the register viewer.

2. Define the behaviour layer of the webpage to handle the user input and to interact with the backend.

3. Review the relevant parts of the RISC-V ISA, which will be the RV64I base integer instruction set (version 2.1 of the ratified RISC-V specification).

4. Implement the backend to handle the compilation and execution of basic instructions such as adding, moving, subtracting, and comparing.

## Appendix A: The RISC-V ISA
This runtime simulator will be trying to match the latest ratfound at ratified technical specifications for the RISC-V ISA (https://lf-riscv.atlassian.net/wiki/spaces/HOME/pages/16154769/RISC-V+Technical+Specifications). I will begin by pouring through the 
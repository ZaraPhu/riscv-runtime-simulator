# riscv-web-compiler

This project is a webpage which features a RISC-V compiler. As I go through, I will attempt to restrict my scope to what is useful in an educational context. That means that it will not entirely implement every part of the RISC-V ISA, but will instead focus on the most important parts for learning.

Since the most current architectures are 64-bit, I will focus on that. 

The project will be written using a mix of different frontend and backend tools. I'll be experimenting with different tools and technologies as I go along, but the initial idea is to maintain some sepration of concerns by using  Bootstrap for the content/presentation layers, and TypeScript for the behaviour layer and the backend.

## NOTE ABOUT AI
There will be numerous areas where I will be using AI for the code completion and assistant features. This means that not all parts are entirely written by me, but may be AI-generated and then modified by me. This is to speed up the development process and to learn how to use AI within my software development process.

## Goals
1. Create a basic template for the content layer of the webpage to display the RISC-V assembly editor, the memory viewer, and the register viewer.

2. Define the behaviour layer of the webpage to handle the user input and to interact with the backend.

3. Review the relevant parts of the RISC-V ISA, which will be the RV64I base integer instruction set (version 2.1 of the ratified RISC-V specification).

4. Implement the backend to handle the compilation and execution of basic instructions such as adding, moving, subtracting, and comparing.

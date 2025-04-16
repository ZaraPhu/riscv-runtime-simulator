"use strict";
/*
The purpose of this file is to describe the behaviour of the RISC-V
Runtime Assmebler. This file will be compiled to a .js file by the
tsc compiler. The .js file will be used by the linked to the index.html file.
Author: Zara Phukan (https://github.com/ZaraPhu).
Creation Date: April 2, 2025.
*/
/*** Constants and Variables ***/
// Define the RISC-V architecture bit width constant
const XLEN = 32; // XLEN=32 for RV32I instruction set architecture
// DOM elements and state for dark mode functionality
const htmlRootNode = document.querySelector("html");
const darkModeButton = document.querySelector("#toggle-dark-mode");
let darkModeEnabled = false;
// DOM element for the register display panel
const registerList = document.querySelector("#register-list");
/*** Functions ***/
function createRegister(index) {
    /**
     * Creates a new HTML list item element that represents a RISC-V register
     *
     * @param index - The register index (0 to XLEN-1 for standard registers, XLEN for pc)
     * @returns An HTMLLIElement that displays both the register name and its value
     */
    // Create the main list item element
    const newRegister = document.createElement("li");
    newRegister.classList.add("list-group-item");
    // Create a div for flex layout (name and value side by side)
    const innerDiv = document.createElement("div");
    innerDiv.classList.add("d-flex", "justify-content-between", "align-items-center");
    // Create paragraph element for register name
    const registerName = document.createElement("p");
    registerName.classList.add("px-2", "fs-6");
    // Create paragraph element for register value (initialized to zero)
    const registerValue = document.createElement("p");
    registerValue.textContent = "0x00000000";
    registerValue.classList.add("px-2", "fs-6");
    // Set the register name and ID based on the index
    if (index < XLEN) {
        // Standard registers x0 through x31
        registerName.textContent = `x${index}`;
        registerValue.setAttribute("id", `register-${index}`);
    }
    else if (index == XLEN) {
        // Program counter (pc) register
        registerName.textContent = "pc";
        registerValue.setAttribute("id", "pc-register");
    }
    else {
        // Error case: index out of expected range
        registerName.textContent = "ERROR";
        registerValue.setAttribute("id", "error");
    }
    // Assemble the components together
    innerDiv.appendChild(registerName);
    innerDiv.appendChild(registerValue);
    newRegister.appendChild(innerDiv);
    return newRegister;
}
function populateRegisterList() {
    /**
     * Populates the register display panel with all RISC-V registers.
     *
     * Creates and adds list items for all standard registers (x0 to x31)
     * plus the program counter (pc) to the DOM. Each register is represented
     * as an HTML list item showing the register name and its initial value.
     *
     * This function uses the createRegister() helper function to generate
     * the HTML elements for each register and appends them to the registerList
     * element in the DOM.
     */
    for (let i = 0; i < XLEN + 1; i++) {
        let newRegister = createRegister(i);
        registerList === null || registerList === void 0 ? void 0 : registerList.appendChild(newRegister);
    }
}
/*** Program Starting Point */
// sets up the dark mode toggle button
darkModeButton === null || darkModeButton === void 0 ? void 0 : darkModeButton.addEventListener("click", () => {
    darkModeEnabled = !darkModeEnabled;
    if (darkModeEnabled) {
        htmlRootNode.setAttribute("data-bs-theme", "dark");
    }
    else {
        htmlRootNode.setAttribute("data-bs-theme", "light");
    }
});
// sets up the register list and populates it
populateRegisterList();

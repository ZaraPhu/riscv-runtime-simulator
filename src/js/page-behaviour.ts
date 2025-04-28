/*
The purpose of this file is to describe the behaviour of the RISC-V
Runtime Assmebler. This file will be compiled to a .js file by the
tsc compiler. The .js file will be used by the linked to the index.html file.
Author: Zara Phukan (https://github.com/ZaraPhu).
Creation Date: April 2, 2025.
*/

// DOM elements and state for dark mode functionality
const htmlRootNode = document.querySelector("html") as HTMLElement;
const darkModeButton = document.querySelector(
  "#toggle-dark-mode",
) as HTMLButtonElement | null;
let darkModeEnabled: boolean = false;

// DOM element for the register display panel
const registerList = document.querySelector(
  "#register-list",
) as HTMLUListElement | null;

// used to set the number representation of the registers
const binaryCheck: HTMLInputElement = document.querySelector(
  "#binary-check",
) as HTMLInputElement;
const decimalCheck: HTMLInputElement = document.querySelector(
  "#decimal-check",
) as HTMLInputElement;
const hexadecimalCheck: HTMLInputElement = document.querySelector(
  "#hexadecimal-check",
) as HTMLInputElement;
const octalCheck: HTMLInputElement = document.querySelector(
  "#octal-check",
) as HTMLInputElement;

// for the memory peeker
const memoryGrid: HTMLDivElement = document.querySelector(
  "#memory-grid",
) as HTMLDivElement;

/*** Functions ***/
function createRegister(index: number): HTMLLIElement {
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
  innerDiv.classList.add(
    "d-flex",
    "justify-content-between",
    "align-items-center",
  );

  // Create paragraph element for register name
  const registerName = document.createElement("p");
  registerName.classList.add("px-2", "fs-6");

  // Create paragraph element for register value (initialized to zero)
  const registerValue = document.createElement("p");
  registerValue.textContent = "0x00000000";
  registerValue.classList.add("fs-6");

  // Set the register name and ID based on the index
  if (index < XLEN) {
    // Standard registers x0 through x31
    registerName.textContent = `x${index}`;
    registerValue.setAttribute("id", `register-${index}`);
  } else if (index == XLEN) {
    // Program counter (pc) register
    registerName.textContent = "pc";
    registerValue.setAttribute("id", "pc-register");
  } else {
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

function populateRegisterList(): void {
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
  for (let i: number = 0; i < XLEN + 1; i++) {
    let newRegister = createRegister(i);
    registerList?.appendChild(newRegister);
  }
}

function populateMemoryGrid(rows: number, columns: number) {
  /**
   * Populates the memory grid display with a specified number of rows and columns.
   *
   * Creates a grid structure using Bootstrap's row and column layout classes.
   * Each cell in the grid represents a memory location and is initialized
   * with placeholder "test" text.
   *
   * @param rows - The number of rows to create in the memory grid
   * @param columns - The number of columns to create in each row
   */
  for (let i: number = 0; i < rows; i++) {
    const row_i: HTMLDivElement = document.createElement("div");
    row_i.classList.add("row");
    for (let j: number = 0; j < columns; j++) {
      const column_j: HTMLDivElement = document.createElement("div");
      column_j.classList.add("col", "border", "border-primary-subtle");
      column_j.setAttribute("id", `memory-cell-${(i + 1) * rows + j}`);
      column_j.textContent = "0";
      row_i.appendChild(column_j);
    }
    memoryGrid.appendChild(row_i);
  }
}

/*** Program Starting Point */
// sets up the dark mode toggle button
darkModeButton?.addEventListener("click", () => {
  darkModeEnabled = !darkModeEnabled;
  if (darkModeEnabled) {
    htmlRootNode.setAttribute("data-bs-theme", "dark");
  } else {
    htmlRootNode.setAttribute("data-bs-theme", "light");
  }
});

// sets up the register list and populates it
populateRegisterList();

// set up memory grid
populateMemoryGrid(100, 10);

const registerDisplays: HTMLParagraphElement[] = [];
for (let i = 0; i < XLEN; i++) {
  registerDisplays.push(document.querySelector(`#register-${i}`)!);
}
registerDisplays.push(document.querySelector("#pc-register")!);

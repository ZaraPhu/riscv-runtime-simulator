"use strict";
const htmlRootNode = document.querySelector("html");
const darkModeButton = document.querySelector("#toggle-dark-mode");
let darkModeEnabled = false;
const registerList = document.querySelector("#register-list");
const binaryCheck = document.querySelector("#binary-check");
const decimalCheck = document.querySelector("#decimal-check");
const hexadecimalCheck = document.querySelector("#hexadecimal-check");
const octalCheck = document.querySelector("#octal-check");
function createRegister(index) {
    const newRegister = document.createElement("li");
    newRegister.classList.add("list-group-item");
    const innerDiv = document.createElement("div");
    innerDiv.classList.add("d-flex", "justify-content-between", "align-items-center");
    const registerName = document.createElement("p");
    registerName.classList.add("px-2", "fs-6");
    const registerValue = document.createElement("p");
    registerValue.textContent = "0x00000000";
    registerValue.classList.add("px-2", "fs-6");
    if (index < XLEN) {
        registerName.textContent = `x${index}`;
        registerValue.setAttribute("id", `register-${index}`);
    }
    else if (index == XLEN) {
        registerName.textContent = "pc";
        registerValue.setAttribute("id", "pc-register");
    }
    else {
        registerName.textContent = "ERROR";
        registerValue.setAttribute("id", "error");
    }
    innerDiv.appendChild(registerName);
    innerDiv.appendChild(registerValue);
    newRegister.appendChild(innerDiv);
    return newRegister;
}
function populateRegisterList() {
    for (let i = 0; i < XLEN + 1; i++) {
        let newRegister = createRegister(i);
        registerList === null || registerList === void 0 ? void 0 : registerList.appendChild(newRegister);
    }
}
darkModeButton === null || darkModeButton === void 0 ? void 0 : darkModeButton.addEventListener("click", () => {
    darkModeEnabled = !darkModeEnabled;
    if (darkModeEnabled) {
        htmlRootNode.setAttribute("data-bs-theme", "dark");
    }
    else {
        htmlRootNode.setAttribute("data-bs-theme", "light");
    }
});
populateRegisterList();
const registerDisplays = [];
for (let i = 0; i < XLEN; i++) {
    registerDisplays.push(document.querySelector(`#register-${i}`));
}
registerDisplays.push(document.querySelector("#pc-register"));
//# sourceMappingURL=page-behaviour.js.map
declare const assemblyEditor: HTMLTextAreaElement | null;
declare const assembleButton: HTMLButtonElement | null;
declare const errorText: HTMLParagraphElement | null;
declare function raiseError(message: string): void;
declare function parseInput(instructionList: string[]): ParserResult;
declare function executeInstruction(destructuredInstruction: string[]): boolean;

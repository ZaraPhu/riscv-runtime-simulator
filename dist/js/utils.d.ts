declare const XLEN: number;
declare enum Base {
    BINARY = 2,
    OCTAL = 8,
    DECIMAL = 10,
    HEXADECIMAL = 16
}
declare let registerBase: number;
declare enum OperandType {
    IMMEDIATE = 0,
    REGISTER = 1
}
declare enum ParserStatus {
    OK = 0,
    ERR = 1
}
interface ParserResult {
    output: string[][];
    status: ParserStatus.OK | ParserStatus.ERR;
    errMessage: string;
}
declare const I_TYPE: OperandType[];
declare const U_TYPE: OperandType[];
declare const R_TYPE: OperandType[];
declare const NONE_TYPE: OperandType[];
declare const PSEUDO_TYPE: OperandType[];
declare const J_TYPE: OperandType[];
declare const registers: Map<number, string>;
declare const STRINGS_TO_REGISTERS: ReadonlyMap<string, number>;
declare const INSTRUCTION_TO_FORMAT: ReadonlyMap<string, OperandType[]>;
declare const I_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function>;
declare const U_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function>;
declare const R_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function>;
declare const NONE_INSTRUCTION_TO_FUNCTION: ReadonlyMap<string, Function>;
declare function binaryToHex(binVal: string): string;
declare function binaryToOctal(binVal: string): string;
declare function zeroExtend(bits: string): string;
declare function signExtend(bits: string): string;
declare function decimalToTwosComplement(val: number, numDigits: number): string;
declare function twosComplementToDecimal(bits: string): number;
declare function binaryAdd(op1: string, op2: string): string;
declare function setRegisterBase(base: number): void;
declare function updateRegisterDisplays(): void;
declare function setRegister(rd: string, val: string): boolean;
declare function addi(rd: string, rs1: string, imm: number): boolean;
declare function slti(rd: string, rs1: string, imm: number): boolean;
declare function sltiu(rd: string, rs1: string, imm: number): boolean;
declare function andi(rd: string, rs1: string, imm: number): boolean;
declare function ori(rd: string, rs1: string, imm: number): boolean;
declare function xori(rd: string, rs1: string, imm: number): boolean;
declare function slli(rd: string, rs1: string, imm: number): boolean;
declare function srli(rd: string, rs1: string, imm: number): boolean;
declare function srai(rd: string, rs1: string, imm: number): boolean;
declare function lui(rd: string, imm: number): boolean;
declare function auipc(rd: string, imm: number): boolean;
declare function add(rd: string, rs1: string, rs2: string): boolean;
declare function sub(rd: string, rs1: string, rs2: string): boolean;
declare function slt(rd: string, rs1: string, rs2: string): boolean;
declare function sltu(rd: string, rs1: string, rs2: string): boolean;
declare function sll(rd: string, rs1: string, rs2: string): boolean;
declare function srl(rd: string, rs1: string, rs2: string): boolean;

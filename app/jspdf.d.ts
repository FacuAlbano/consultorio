declare module "jspdf" {
  export class jsPDF {
    constructor(opts?: { format?: string; unit?: string });
    output(format: "arraybuffer"): ArrayBuffer;
    getPageWidth(): number;
    getPageHeight(): number;
    addPage(): void;
    getNumberOfPages(): number;
    setPage(n: number): void;
    setFontSize(n: number): void;
    setFont(font: string, style: string): void;
    setTextColor(r: number, g: number, b: number): void;
    text(text: string | string[], x: number, y: number): void;
    splitTextToSize(text: string, maxWidth: number): string[];
  }
}

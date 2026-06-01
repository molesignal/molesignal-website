declare module "wcag-contrast" {
  export function hex(fg: string, bg: string): number;
  export function rgb(fg: [number, number, number], bg: [number, number, number]): number;
  export function score(ratio: number): "Fail" | "AA" | "AAA";
}

declare module 'color-thief-browser' {
  export default class ColorThief {
    getPalette(img: HTMLImageElement, colorCount?: number): [number, number, number][];
  }
} 
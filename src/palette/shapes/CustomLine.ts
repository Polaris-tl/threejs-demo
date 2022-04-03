import { Shape } from "./Shape"
class CustomLine extends Shape {
  paths: [number, number][];
  fillStyle: string;
  constructor (x: number, y: number, paths: [number, number][],  fillStyle: string = '#000') {
    super( x, y, 'customLine');
    this.x = x
    this.y = y
    this.paths = paths
    this.fillStyle = fillStyle
  }

  draw (ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    if (this.paths.length < 2) return;
    ctx.moveTo(...this.paths[0]);
    for (let i = 1; i < this.paths.length; i++) {
      ctx.lineTo(...this.paths[i]);
    }
    ctx.stroke();
    ctx.closePath();
  }

  isInRect(x: number, y: number) {
    const round = 2
    const paths = this.paths
    for (let i = 0; i < paths.length; i++) {
      if (((this.paths[i][0] - x) ** 2 + (this.paths[i][1] - y) ** 2) < round) {
        return true
      }
    }
    return false
  }

}
export { CustomLine }

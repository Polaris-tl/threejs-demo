import { Shape } from "./Shape"
class Rect extends Shape {
  width: number;
  height: number;
  fillStyle: string;
  constructor (x: number, y: number, width: number, height: number, fillStyle: string = '#000') {
      super( x, y, 'rect');
      this.x = x
      this.y = y
      this.width = width
      this.height = height
      this.fillStyle = fillStyle
  }

  draw (ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.stroke();
    ctx.closePath();
  }

  isInRect(x: number, y: number) {
    const hW = this.width / 2
    const hH = this.height / 2
    const middleX = this.x + hW
    const middleY = this.y + hH
    return (Math.abs(x - middleX) < Math.abs(hW)) && (Math.abs(y - middleY) < Math.abs(hH))
  }

  setWidthHeight(width: number, height: number) {
    this.width = width
    this.height = height
  }

}
export { Rect }

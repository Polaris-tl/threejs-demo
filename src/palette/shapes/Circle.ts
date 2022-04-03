import { Shape } from './Shape'
class Circle extends Shape {
	radius: number
	fillStyle: string
	constructor(x: number, y: number, radius: number, fillStyle: string = '#000') {
		super(x, y, 'circle')
		this.x = x
		this.y = y
		this.radius = radius
		this.fillStyle = fillStyle
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.beginPath()
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
		ctx.stroke()
		ctx.closePath()
	}

	isInRect(x: number, y: number) {
		return Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2) <= Math.pow(this.radius, 2)
	}

	setRadius(radius: number) {
		this.radius = radius
	}
}
export { Circle }

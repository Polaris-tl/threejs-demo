export type AllShapeType = 'circle' | 'rect' | 'customLine' | 'text'

abstract class Shape {
	shape: AllShapeType
	x: number
	y: number
	offsetX: number
	offsetY: number
	constructor(x: number, y: number, shape: AllShapeType) {
		this.shape = shape
		this.x = x
		this.y = y
		this.offsetX = 0
		this.offsetY = 0
	}

	// 绘制
	abstract draw(ctx: CanvasRenderingContext2D, active: boolean, time?: number): void
	// 判断是点否在当前图形内部
	abstract isInRect(x: number, y: number): boolean
	// 设置偏移
	setOffset(offsetX: number, offsetY: number) {
		this.offsetX = offsetX
		this.offsetY = offsetY
	}
	// 位移
	translate(x: number, y: number) {
		this.x += x
		this.y += y
	}
	// 设置Shape的坐标
	setPosition(x: number, y: number) {
		this.x = x
		this.y = y
	}
}

export { Shape }

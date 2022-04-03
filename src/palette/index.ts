import { Circle, Rect, CustomLine, Text, AllShape, AllShapeType } from './shapes'

type CommonData = {
	shape?: AllShapeType
	x?: number
	y?: number
	width?: number
	height?: number
	radius?: number
	path?: [number, number]
	paths?: [number, number][]
	text?: string
}

class Palette {
	canvas = document.createElement('canvas')
	shapes: AllShape[] = [] // 所有的shape
	ctx: CanvasRenderingContext2D
	enabled = true // 是否启用
	color = 'red'
	lineWidth = 1
	currentMode: AllShapeType = 'rect' // 当前正在进行中的绘制模式
	lastShape: AllShape | null = null
	constructor(width: number, height: number) {
		this.ctx = this.canvas.getContext('2d') as any as CanvasRenderingContext2D
		this.ctx.fillStyle = 'red'
		this.canvas.width = width
		this.canvas.height = height
		this.canvas.style.position = 'absolute'
		this.canvas.style.top = '0'
		// this.animate()
	}

	onDrawing(data: CommonData) {
		const { x = 0, y = 0, radius = 0, width = 0, height = 0, path = [0, 0] } = data
		switch (this.currentMode) {
			case 'circle':
				if (this.lastShape && this.lastShape instanceof Circle) {
					this.lastShape.radius = radius
					this.lastShape.x = x
					this.lastShape.y = y
				} else {
					this.shapes.push(new Circle(radius, x, y))
				}
				break
			case 'rect':
				if (this.lastShape && this.lastShape instanceof Rect) {
					this.lastShape.width = width
					this.lastShape.height = height
					this.lastShape.x = x
					this.lastShape.y = y
				} else {
					this.shapes.push(new Rect(x, y, width, height))
				}
				break
			case 'customLine':
				if (this.lastShape && this.lastShape instanceof CustomLine) {
					this.lastShape.paths.push(path)
				} else {
					this.shapes.push(new CustomLine(x, y, []))
				}
				break
			default:
				break
		}
		this.draw()
	}

	onTexting(text: string, selectionStart: number, selectionEnd: number) {
		if (this.lastShape && this.lastShape instanceof Text) {
			this.lastShape.text = text
			this.lastShape.cursor = selectionStart
			const lineTexts = this.lastShape.text.split('\n') //实现换行
			console.log(lineTexts, 'lineTexts')
			console.log(selectionStart, 'cursor')
			const [x, y] = this.lastShape.calculateCursorPosition(lineTexts, selectionStart)
			console.log(x, y)
		}
		this.draw()
	}

	beforeDraw(data?: CommonData) {
		// debugger
		this.lastShape = this.getInitShape(data)
		if (this.lastShape) {
			this.shapes.push(this.lastShape)
		}
	}

	beforeText(x = 0, y = 0) {
		this.lastShape = new Text(x, y, '')
		this.shapes.push(this.lastShape)
	}
	afterText() {
		this.lastShape = null
	}

	getInitShape(data?: CommonData): AllShape | null {
		const { x = 0, y = 0, radius = 0, width = 0, height = 0, text = 'tl', shape, paths = [] } = data || {}
		const key = shape || this.currentMode
		switch (key) {
			case 'circle':
				return new Circle(x, y, radius)
			case 'rect':
				return new Rect(x, y, width, height)
			case 'customLine':
				return new CustomLine(x, y, paths)
			case 'text':
				return new Text(x, y, text)
			default:
				return null
		}
	}

	afterDraw() {
		this.lastShape = null
	}

	// 一次性设置绘制命令
	setShapes(shapes: AllShape[]) {
		if (!this.enabled) return
		this.shapes = shapes
		this.draw()
	}

	// 一次性设置绘制命令 raw格式
	setShapesRaw(shapesRaw: CommonData[]) {
		if (!this.enabled) return
		const shapes: AllShape[] = []
		shapesRaw.forEach(item => {
			const shape = this.getInitShape(item)
			shape && shapes.push(shape)
		})
		this.shapes = shapes
		this.draw()
	}

	// 移除shape
	removeShape(shape: AllShape) {
		if (!this.enabled) return
		const index = this.shapes.findIndex(val => val === shape)
		if (~index) {
			this.shapes.splice(index, 1)
			this.draw()
		}
	}

	// 清楚画布
	clearAll() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
	}

	// 把所有shape都取出来执行一遍
	draw() {
		this.clearAll()
		this.shapes.forEach(shape => {
			shape.draw(this.ctx, this.lastShape === shape)
		})
	}

	// 启用、停用画板
	toggleEnable() {
		this.enabled = !this.enabled
	}
}

export { Palette }

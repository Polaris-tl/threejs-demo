import { Shape } from './Shape'
class Text extends Shape {
	text: string
	cursor: number
	texting = true
	constructor(x: number, y: number, text: string) {
		super(x, y, 'circle')
		this.x = x
		this.y = y
		this.text = text
		this.cursor = 0
	}

	draw(ctx: CanvasRenderingContext2D, active: boolean, time?: number) {
		const lineTexts = this.text.split('\n') //实现换行
		lineTexts.forEach((text, i) => {
			ctx.direction = 'ltr'
			ctx.font = `bold 30px sans-serif`
			ctx.textAlign = 'left'
			ctx.textBaseline = 'top'
			ctx.fillStyle = 'red'
			ctx.fillText(text, this.x, this.y + 30 * i)
		})
		if (this.texting) {
			this.drawOutline(ctx, lineTexts)
			active && this.drawCursor(ctx, time)
		}
	}

	// 画边框
	drawOutline(ctx: CanvasRenderingContext2D, lineTexts: string[]) {
		let widest = 0
		lineTexts.forEach(text => {
			const elem = ctx.measureText(text)
			if (elem.width > widest) {
				widest = elem.width
			}
		})

		ctx.beginPath()
		ctx.rect(this.x - 10, this.y + 4, widest + 30, 30 * lineTexts.length)
		ctx.stroke()
		ctx.closePath()
	}

	// 画光标
	drawCursor(ctx: CanvasRenderingContext2D, time = 0) {
		const lineTexts = this.text.split('\n') //实现换行
		const [x, y] = this.calculateCursorPosition(lineTexts, this.cursor)
		const elem = ctx.measureText(lineTexts[y].substring(0, x))
		ctx.beginPath()
		ctx.moveTo(this.x + elem.width, this.y + y * 30 + 8)
		ctx.globalAlpha = (Math.sin(time / 100) + 1) / 2
		ctx.lineTo(this.x + elem.width, this.y + y * 30 + 28)
		ctx.stroke()
		ctx.globalAlpha = 1
		ctx.closePath()
	}

	// 计算光标所在的航和列
	calculateCursorPosition(lineTexts: string[], cursor: number) {
		let x = 0,
			y = 0
		for (let i = 0; i < lineTexts.length; i++) {
			const left = cursor - lineTexts[i].length - 1
			if (left > 0 || !lineTexts[i]) {
				x = left
				y++
				cursor = left
			}
			if (i == 0) {
				x = cursor
			}
		}
		return [x, y]
	}

	isInRect(x: number, y: number) {
		return false
	}
}
export { Text }

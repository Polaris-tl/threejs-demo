import { Circle } from './Circle'
import { Shape, AllShapeType } from './Shape'
import { CustomLine } from './CustomLine'
import { Rect } from './Rect'
import { Text } from './Text'

export { Circle, CustomLine, Rect, Shape, Text, AllShapeType }

export type AllShape = Circle | CustomLine | Rect | Text

import { GraphElementBase } from './GraphElementBase'

export interface Wire extends GraphElementBase {
  template: { type: 'wire' }
  current: {
    position: [number, number]
    dimensions: {
      width: number
      height: number
    }
    anchors: { [key: string]: [number, number] }
    mode: 'hidden' | 'thin' | 'thick' | 'dashed'
    from: [number, number]
    to: [number, number]
    sources: {
      from?: {
        element: string
        parameter: string
      }
      to?: {
        element: string
        parameter: string
      }
    }
  }
}

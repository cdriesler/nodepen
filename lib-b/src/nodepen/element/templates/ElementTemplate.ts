import { GrasshopperComponent } from '../../../grasshopper/GrasshopperComponent'

export type ElementTemplate = {
    'static-component': {
        type: 'static-component'
    } & GrasshopperComponent,
    'static-parameter': {
        type: 'static-parameter'
    } & GrasshopperComponent,
    'panel': {
        type: 'panel'
    },
    'number-slider': {
        type: 'number-slider'
    },
    'wire': {
        type: 'wire'
        mode: 'data' | 'live' | 'provisional'
        from: {
            elementId: string
            parameterId: string
        }
        to: {
            elementId: string
            parameterId: string
        }
    }
}
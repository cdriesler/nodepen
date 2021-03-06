import React, { useState, useRef, useEffect } from 'react'
import { Grasshopper } from 'glib'
import { useGraphManager } from '@/context/graph'
import { useLongHover } from '@/hooks'
import { ElementButton, ElementDraggable } from '../annotation'

export const GraphControlsFooter = (): React.ReactElement => {
  const {
    store: { library },
    dispatch,
  } = useGraphManager()

  const [selectedCategory, setSelectedCategory] = useState('params')

  const visibleComponents = Object.values<Grasshopper.Component[]>(library[selectedCategory])

  const capitalize = (string: string): string => {
    return `${string[0].toUpperCase()}${string.substring(1)}`
  }

  const [stagedComponent, setStagedComponent] = useState<Grasshopper.Component>()
  const [start, setStart] = useState<[number, number]>()

  const handleStartPlacement = (e: React.PointerEvent<HTMLButtonElement>, component: Grasshopper.Component): void => {
    const { pageX, pageY } = e
    setStagedComponent(component)
    setStart([pageX, pageY])
  }

  const handlePlacement = (position: [number, number], component: Grasshopper.Component): void => {
    setStagedComponent(undefined)
    setStart(undefined)

    if (component.category.toLowerCase() === 'params') {
      switch (component.name.toLowerCase()) {
        case 'panel': {
          dispatch({ type: 'graph/add-panel', position })
          break
        }
        case 'number slider': {
          dispatch({ type: 'graph/add-number-slider', position })
          break
        }
        default: {
          dispatch({ type: 'graph/add-parameter', position, component })
        }
      }
    } else {
      dispatch({ type: 'graph/add-component', position, component })
    }
  }

  return (
    <div className={`pl-6 pr-6 w-full bg-green flex flex-row z-10`}>
      <div id="components-container" className="flex-grow flex flex-col overflow-hidden">
        <div className="w-full h-8 flex flex-row items-center">
          {Object.keys(library).map((category) => (
            <button
              key={`cat-${category}`}
              className={`${
                category === selectedCategory ? 'text-darkgreen font-semibold' : 'text-swampgreen font-normal'
              } font-sans text-sm mr-4 hover:text-darkgreen`}
              onClick={() => setSelectedCategory(category)}
            >
              {`${capitalize(category)}`}
            </button>
          ))}
        </div>
        <div className="w-full h-12 max-h-full pb-2 flex flex-row items-center overflow-auto">
          {visibleComponents.map((subcategories, i) => (
            <>
              {subcategories.map((component, j) => (
                <ElementButton
                  key={`${i}-component-${component.name}`}
                  component={component}
                  onStartPlacement={handleStartPlacement}
                />
              ))}
              {i < visibleComponents.length - 1 ? (
                <div key={`div-${i}`} className="h-4 mr-3 inline-block border-r-2 border-swampgreen" />
              ) : null}
            </>
          ))}
        </div>
      </div>
      {stagedComponent && start ? (
        <ElementDraggable
          start={start}
          template={stagedComponent}
          onCancel={() => setStagedComponent(undefined)}
          onDrop={handlePlacement}
        />
      ) : null}
    </div>
  )
}

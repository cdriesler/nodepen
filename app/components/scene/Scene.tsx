import React from 'react'
import { Canvas } from 'react-three-fiber'
import { OrthographicCamera, OrbitControls } from '@react-three/drei'
import { Glasshopper } from 'glib'
import { useGraphManager } from '@/context/graph'
import { useSceneManager } from './lib/context'
import { SceneElementId as Id } from './lib/types'
import * as Geometry from './lib/geometry'

const Scene = (): React.ReactElement => {
  const {
    store: { elements },
  } = useGraphManager()

  const {
    store: { selection },
  } = useSceneManager()

  const getElementTrees = (element: Glasshopper.Element.Base): [string, Glasshopper.Data.DataTree][] => {
    switch (element.template.type) {
      case 'static-component': {
        const component = element as Glasshopper.Element.StaticComponent

        return Object.entries(component.current.values)
      }
      case 'static-parameter': {
        const parameter = element as Glasshopper.Element.StaticParameter

        return [['output', parameter.current.values]]
      }
      default: {
        return []
      }
    }
  }

  const elementsToValues = (
    elements: Glasshopper.Element.Base[]
  ): [Id, Glasshopper.Data.DataTreeValue<Glasshopper.Data.ValueType>][] => {
    const results: [Id, Glasshopper.Data.DataTreeValue<Glasshopper.Data.ValueType>][] = []

    elements.forEach((el) => {
      const trees = getElementTrees(el)
      trees.forEach(([parameter, tree]) => {
        Object.entries(tree ?? {}).forEach(([branch, values]) => {
          values.forEach((value, i) => {
            const id: Id = {
              element: el.id,
              parameter: parameter,
              branch: branch,
              index: i,
            }

            results.push([id, value])
          })
        })
      })
    })

    console.log(`Scene has ${results.length} items.`)

    return results
  }

  const idToKey = (id: Id): string => {
    const { element, parameter, branch, index } = id
    return `scene-${element}-${parameter}-${branch}-${index}`
  }

  return (
    <Canvas>
      <OrthographicCamera />
      <OrbitControls />
      <>
        {elementsToValues(Object.values(elements)).map(([id, value]) => {
          const selected = selection.includes(id.element)

          switch (value.type) {
            case 'point': {
              const { data } = value as Glasshopper.Data.DataTreeValue<'point'>

              return <Geometry.Point key={idToKey(id)} point={data} selected={selected} />
            }
            default: {
              return null
            }
          }
        })}
      </>
    </Canvas>
  )
}

export default Scene

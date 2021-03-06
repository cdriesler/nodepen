import React, { useState, useEffect, useRef } from 'react'
import { Glasshopper } from 'glib'
import { useGraphManager } from '@/context/graph'
import { graph } from '@/utils'
import { ParameterIcon, ParameterIconShadow, ParameterSetValue } from './parameters'
import { Details, Grip, DataTree, RuntimeMessage, Loading, ConfigureButton } from './common'
import { useElementStatus, useMoveableElement, useSelectableElement } from './utils'
import { Tooltip } from '../annotation'
import { useLongHover } from '@/hooks'
import { NumberInput } from '~/components/input/NumberInput'
import { hotkey } from '@/utils'

type StaticComponentProps = {
  instanceId: string
}

export const StaticParameter = ({ instanceId: id }: StaticComponentProps): React.ReactElement | null => {
  const {
    store: { elements, library, activeKeys },
    dispatch,
  } = useGraphManager()

  const parameterRef = useRef<HTMLDivElement>(null)

  const [status, color] = useElementStatus(id)

  useEffect(() => {
    if (!parameterRef) {
      return
    }

    dispatch({ type: 'graph/register-element', ref: parameterRef, id })
  }, [])

  const isMoving = useRef(false)

  const onMoveStart = (): void => {
    isMoving.current = true
  }

  const onMove = (motion: [number, number]): void => {
    dispatch({ type: 'graph/mutation/move-component', motion, id })
  }

  const onMoveEnd = (): void => {
    isMoving.current = false
  }

  const moveRef = useMoveableElement(onMove, onMoveStart, onMoveEnd)

  const onSelect = (): void => {
    switch (hotkey.selectionMode(activeKeys)) {
      case 'replace': {
        dispatch({ type: 'graph/selection-clear' })
        dispatch({ type: 'graph/selection-add', id })
        break
      }
      case 'remove': {
        dispatch({ type: 'graph/selection-remove', id })
        break
      }
      case 'add': {
        dispatch({ type: 'graph/selection-add', id })
        break
      }
    }
  }

  useSelectableElement(onSelect, moveRef)

  const parameter = elements[id] as Glasshopper.Element.StaticParameter

  const { template, current } = parameter
  const [dx, dy] = current.position

  const [[overPanel, overDetails], setHovers] = useState<[boolean, boolean]>([false, false])
  const [detailsPinned, setDetailsPinned] = useState(false)

  const wireIsBlocking = elements['live-wire'] ? (elements['live-wire']?.current as any)?.mode !== 'hidden' : false

  const [isConfiguring, setIsConfiguring] = useState(false)

  const captureMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation()
  }

  const handleLongHover = (e: PointerEvent): void => {
    if (isMoving.current) {
      return
    }

    const { pageX, pageY } = e

    const tooltip = (
      <>
        <Tooltip
          component={library[template.category.toLowerCase()][template.subcategory.toLowerCase()].find(
            (t) => t.guid === template.guid
          )}
          data={current.values}
          runtimeMessage={parameter.current?.runtimeMessage}
          onDestroy={() => dispatch({ type: 'tooltip/clear-tooltip' })}
        />
      </>
    )

    dispatch({ type: 'tooltip/set-tooltip', position: [pageX, pageY], content: tooltip })
  }

  const longHoverTarget = useLongHover(handleLongHover)

  const [parameterValue, setParameterValue] = useState(0)
  const [temporaryParameterValue, setTemporaryParameterValue] = useState(0)

  // useEffect(() => {
  //   const value = Object.values(current.values)?.[0]?.[0] as Glasshopper.Data.DataTreeValue<'number'>

  //   console.log(`Updating value to ${value.data}`)

  //   if (!value) {
  //     return
  //   }

  //   setParameterValue(value.data)
  //   setTemporaryParameterValue(value.data)
  // }, [current.values])

  if (!elements[id] || elements[id].template.type !== 'static-parameter') {
    console.error(`Mismatch with element '${id}' and attempted type 'static-parameter'`)
    return null
  }

  return (
    <div className="absolute flex flex-row justify-center w-48" style={{ left: dx - 96, top: -dy - 18 }}>
      <div className="flex flex-col items-center" ref={parameterRef}>
        {isConfiguring ? null : (
          <div className="relative w-0 h-0 overflow-visible">
            <div className="absolute w-8 h-8" style={{ left: -90, top: 4 }}>
              <ConfigureButton onClick={() => setIsConfiguring(true)} />
            </div>
          </div>
        )}
        <div
          className="flex flex-row justify-center items-center relative z-20"
          onPointerEnter={() => setHovers(([, details]) => [true, details])}
          onPointerLeave={() => setHovers(([, details]) => [false, details])}
          onMouseDown={captureMouseDown}
          ref={longHoverTarget}
          role="presentation"
        >
          <div
            className="absolute w-8 h-4 flex justify-center overflow-visible z-30"
            style={{ top: '-1.2rem', right: 0 }}
          >
            <Loading visible={status === 'waiting'} />
          </div>
          <div className="absolute z-0" style={{ left: '-12.5px', transform: 'translate(2px, 1.5px)' }}>
            <ParameterIconShadow />
          </div>
          <div
            className="h-8 pt-4 pb-4 flex flex-row items-center border-2 border-dark rounded-md shadow-osm relative transition-colors duration-150 z-20"
            style={{ background: color }}
            ref={moveRef}
          >
            <div className="absolute z-20" style={{ left: '-12.5px' }}>
              <ParameterIcon parent={parameter.id} />
            </div>
            <div
              className="ml-6 mr-6 font-panel font-bold text-sm text-dark select-none z-10"
              style={{ left: '0', transform: 'translateY(1px)' }}
            >
              {template.nickname.toUpperCase()}
            </div>
          </div>
          <div className="absolute z-0 flex flex-col justify-center items-center" style={{ right: -8 }}>
            <Grip source={{ element: parameter.id, parameter: 'output' }} />
          </div>
        </div>
        {isConfiguring ? (
          <div
            className="flex flex-col w-48 overflow-hidden z-10"
            style={{ transform: 'translate(0, -18px)' }}
            onPointerEnter={() => setHovers(([panel]) => [panel, true])}
            onPointerLeave={() => setHovers(([panel]) => [panel, false])}
          >
            <Details pinned={detailsPinned} onPin={() => setDetailsPinned((current) => !current)}>
              <>
                <NumberInput
                  value={temporaryParameterValue}
                  onChange={(value) => setTemporaryParameterValue(Number.parseFloat(value))}
                />
                <div className="w-full mt-2 flex flex-row items-center gap-2">
                  <button
                    onClick={() => {
                      setIsConfiguring(false)
                      setTemporaryParameterValue(parameterValue)
                    }}
                    className="p-0 pt-1 flex-grow flex justify-center item-center border-2 border-green rounded-sm font-panel text-sm font-medium text-darkgreen hover:bg-green"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsConfiguring(false)
                      setParameterValue(temporaryParameterValue)
                      dispatch({
                        type: 'graph/values/set-one-value',
                        targetElement: id,
                        targetParameter: 'input',
                        value: temporaryParameterValue.toString(),
                      })
                    }}
                    className="p-0 pt-1 flex-grow flex justify-center item-center border-2 border-green rounded-sm font-panel text-sm font-medium text-darkgreen hover:bg-green"
                  >
                    Submit
                  </button>
                </div>
                {/* {(() => {
                  if (Object.keys(current.values).length > 0) {
                    const valueCount = graph.getValueCount(parameter, 'output')
                    return (
                      <DataTree
                        label={`${valueCount} manual value${valueCount === 1 ? '' : 's'}`}
                        data={current.values}
                      />
                    )
                  }

                  const sourceCount = graph.getSourceCount(current.sources)
                  if (sourceCount > 0) {
                    return (
                      <div className="mt-1 p-1 pl-2 pr-2 h-5 flex items-center rounded-sm bg-green">
                        <p
                          className="flex-grow font-panel font-bold text-darkgreen text-xs"
                          style={{ transform: 'translateY(1px)' }}
                        >{`${sourceCount} source${sourceCount === 1 ? '' : 's'}`}</p>
                        <p className="text-sm text-pale">&#9660;</p>
                      </div>
                    )
                  }

                  return <ParameterSetValue element={id} keepOpen={() => setDetailsPinned(true)} />
                })()} */}
              </>
            </Details>
          </div>
        ) : null}
      </div>
    </div>
  )
}

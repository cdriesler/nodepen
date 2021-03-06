import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Glasshopper } from 'glib'
import { useGraphManager } from '@/context/graph'
import { LibraryCommand } from '../annotation'
import { Wire, Panel, StaticComponent, StaticParameter, NumberSlider } from '../elements'

type ControlMode = 'idle' | 'panning' | 'selecting'

export const GraphCanvas = (): React.ReactElement => {
  const {
    store: { elements, camera, overlay, solution },
    dispatch,
  } = useGraphManager()

  // Handle global keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (libraryMenuPosition) {
        return
      }

      switch (e.code) {
        case 'Space': {
          const watching = ['static-component', 'static-parameter', 'number-slider']
          console.log(Object.values(elements).filter((el) => watching.includes(el.template.type)))
          dispatch({ type: 'session/expire-solution' })
          break
        }
        case 'Delete': {
          dispatch({ type: 'graph/mutation/delete-selection' })
          break
        }
        case 'ControlLeft':
        case 'ShiftLeft': {
          dispatch({ type: 'graph/hotkey/add-active-key', code: e.code })
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent): void => {
      switch (e.code) {
        case 'ControlLeft':
        case 'ShiftLeft': {
          dispatch({ type: 'graph/hotkey/remove-active-key', code: e.code })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  })

  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch({ type: 'graph/register-camera', ref: canvasRef })
  }, [])

  const [mode, setMode] = useState<ControlMode>('idle')
  const [[sx, sy], setStart] = useState<[number, number]>([0, 0])
  const [[ax, ay], setAnchor] = useState<[number, number]>([0, 0])
  const [startTime, setStartTime] = useState(0)
  const [previousTime, setPreviousTime] = useState(0)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>): void => {
    if (overlay.tooltip) {
      dispatch({ type: 'tooltip/clear-tooltip' })
    }

    if (mode !== 'idle') {
      return
    }

    const { pageX, pageY } = e

    setStart([pageX, pageY])
    setAnchor([pageX, pageY])

    const now = Date.now()
    setStartTime(now)
    setPreviousTime(now)

    switch ((e as React.PointerEvent)?.pointerType == 'mouse' ? e.button : 2) {
      case 0:
        setMode('selecting')
        console.log('selecting!')
        break
      case 2:
        setMode('panning')
        e.preventDefault()
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (Date.now() - previousTime < 5) {
      return
    }

    const { pageX: ex, pageY: ey } = e

    switch (mode) {
      case 'panning': {
        const [dx, dy] = [ax - ex, ay - ey]

        dispatch({ type: 'camera/pan', dx, dy })

        setAnchor([ex, ey])
        setPreviousTime(Date.now())
        break
      }
      case 'selecting': {
        setAnchor([ex, ey])
        setPreviousTime(Date.now())
        break
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    switch (mode) {
      case 'selecting': {
        const isShort = Date.now() - startTime < 150
        const isStatic = Math.abs(sx - ax) < 15 && Math.abs(sy - ay) < 15

        if (isShort && isStatic) {
          dispatch({ type: 'graph/selection-clear' })
        } else {
          dispatch({ type: 'graph/selection-region', from: [sx, sy], to: [ax, ay], partial: sx > ax })
        }
      }
    }

    setMode('idle')
  }

  const blockContextMenu = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
  }

  const [dx, dy] = camera.position

  const [libraryMenuPosition, setLibraryMenuPosition] = useState<[number, number]>(undefined)

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    const { pageX, pageY } = e

    setLibraryMenuPosition([pageX, pageY])
  }

  const [mx, my] = libraryMenuPosition ?? [0, 0]

  const liveWire = elements['live-wire'] ? <Wire key={'live-wire-element'} instanceId="live-wire" /> : null

  const graphElements = useMemo(() => {
    return (
      <>
        {Object.values(elements).map((element) => {
          switch (element.template.type) {
            case 'static-component': {
              return <StaticComponent key={`el-${element.id}`} instanceId={element.id} />
            }
            case 'static-parameter': {
              return <StaticParameter key={`param-${element.id}`} instanceId={element.id} />
            }
            case 'wire': {
              return <Wire key={`wire-${element.id}`} instanceId={element.id} />
            }
            case 'panel': {
              return <Panel key={`panel-${element.id}`} instanceId={element.id} />
            }
            case 'number-slider': {
              return <NumberSlider key={`number-slider-${element.id}`} instanceId={element.id} />
            }
            default: {
              console.log(`Could not render '${element.template.type}'. ${element.id} `)
            }
          }
        })}
      </>
    )
  }, [elements, solution.id])

  return (
    <div
      ref={canvasRef}
      className="w-full flex-grow bg-pale z-0 overflow-visible relative"
      style={{
        backgroundSize: '25px 25px',
        backgroundPosition: `${-dx % 25}px ${-dy % 25}px`,
        backgroundImage:
          'linear-gradient(to right, #98e2c6 0.3mm, transparent 1px, transparent 10px), linear-gradient(to bottom, #98e2c6 0.3mm, transparent 1px, transparent 10px)',
      }}
      onContextMenu={blockContextMenu}
      onMouseDown={handleMouseDown}
      onPointerDown={handleMouseDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      role="presentation"
    >
      {libraryMenuPosition ? (
        <div className="fixed z-50" style={{ left: mx, top: my }}>
          <LibraryCommand position={libraryMenuPosition} onDestroy={() => setLibraryMenuPosition(undefined)} />
        </div>
      ) : null}
      {overlay.tooltip ? (
        <div
          className="fixed z-50"
          style={{ left: overlay.tooltip.position[0], top: overlay.tooltip.position[1] }}
          onPointerOver={() => dispatch({ type: 'tooltip/clear-tooltip' })}
        >
          {overlay.tooltip.content}
        </div>
      ) : null}
      {canvasRef.current ? (
        <div
          id="element-container"
          className="w-full h-full relative overflow-visible z-20"
          style={{
            transform: `translate(${-dx}px, ${-dy}px)`,
            left: canvasRef.current.clientWidth / 2,
            top: canvasRef.current.clientHeight / 2,
          }}
        >
          {graphElements}
          {liveWire}
        </div>
      ) : null}
      <div
        className={`${
          sx > ax ? 'border-dashed' : ''
        } fixed border-2 border-dark rounded-sm transition-opacity duration-100`}
        style={{
          left: Math.min(ax, sx),
          top: Math.min(ay, sy),
          width: Math.abs(ax - sx),
          height: Math.abs(ay - sy),
          opacity: mode === 'selecting' ? 100 : 0,
        }}
      />
    </div>
  )
}

import { useGraphManager } from '@/context/graph'
import { useCallback, useEffect, useRef } from 'react'
import { useCameraDispatch, useCameraPosition } from '../store/hooks'

type CameraAnchor = 'TL' | 'TR' | 'C'

export const useSetCameraPosition = (): ((
  x: number,
  y: number,
  anchor?: CameraAnchor,
  offset?: number
) => Promise<void>) => {
  const {
    registry: { setTransform },
  } = useGraphManager()
  const { setPosition } = useCameraDispatch()
  // const cameraPosition = useCameraPosition()

  const startPosition = useRef<[number, number]>([0, 0])

  // useEffect(() => {
  //   startPosition.current = cameraPosition
  // }, [cameraPosition])

  const startTime = useRef<number>(0)
  const duration = useRef<number>(350)

  /**
   * Have camera 'look at' position on graph relative to a screen anchor position.
   * @remarks `offset` has no effect on `C` anchor
   */
  const setCameraPosition = useCallback(
    (x: number, y: number, anchor: CameraAnchor = 'C', offset = 0) => {
      return new Promise<void>((resolve, reject) => {
        if (!setTransform) {
          reject()
          return
        }

        const [w, h] = [window.innerWidth, window.innerHeight - 48 - 36]

        const [dx, dy] = (() => {
          switch (anchor) {
            case 'C': {
              return [w / 2, h / 2]
            }
            case 'TL': {
              return [0 + offset, 0 + offset]
            }
            case 'TR': {
              return [w - offset, 0 + offset]
            }
          }
        })()

        const [tx, ty] = [-x + dx, -y + dy]

        // console.log({ start: startPosition })
        // console.log({ to: [x, y] })

        startTime.current = Date.now()

        // Trigger library move
        setTransform(tx, ty, 1, duration.current, 'easeInOutQuint')

        // Begin parallel camera position move
        const xDelta = tx - startPosition.current[0]
        const yDelta = ty - startPosition.current[1]

        const animate = (t: number): void => {
          const easeInOutQuint = (t: number): number => {
            return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t
          }

          const remap = (t: number): number => {
            return easeInOutQuint(t) / easeInOutQuint(1)
          }

          const f = remap(t)

          const xPosition = startPosition.current[0] + xDelta * f
          const yPosition = startPosition.current[1] + yDelta * f

          setPosition([xPosition, yPosition])
        }

        const i = setInterval(() => {
          const f = Date.now()

          if (f >= startTime.current + duration.current) {
            clearInterval(i)
            animate(1)
            resolve()
            return
          }

          const t = (f - startTime.current) / duration.current

          animate(t)
        }, 5)
      })
    },
    [startPosition]
  )

  return setCameraPosition
}

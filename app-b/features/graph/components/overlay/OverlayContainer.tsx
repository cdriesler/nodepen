import React from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

type OverlayContainerProps = {
  children: JSX.Element
  position: [left: number, top: number]
}

export const OverlayContainer = ({ children, position }: OverlayContainerProps): React.ReactElement => {
  const [left, top] = position

  return (
    <div className="w-full h-full relative pointer-events-auto">
      <TransformWrapper
        initialScale={1}
        initialPositionX={left}
        initialPositionY={top}
        minScale={1}
        maxScale={1}
        limitToBounds={false}
        wheel={{
          disabled: true,
        }}
        pinch={{
          disabled: true,
        }}
        doubleClick={{
          disabled: true,
        }}
      >
        <TransformComponent>
          <div className="w-vw h-vh">
            <div className="w-full h-full relative">{children}</div>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
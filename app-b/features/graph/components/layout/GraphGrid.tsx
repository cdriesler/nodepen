import React from 'react'
import { useGridDimensions } from '../../store/hooks'

const GraphGrid = (): React.ReactElement => {
  const {
    size,
    thickness,
    position: [cx, cy],
  } = useGridDimensions()

  return (
    <div
      className={`w-full h-full bg-pale z-0 overflow-hidden relative transition-opacity duration-75`}
      style={{
        backgroundSize: `${size}mm ${size}mm`,
        backgroundPosition: `${cx}mm ${cy}mm`,
        backgroundImage: `linear-gradient(to right, #98e2c6 ${thickness}mm, transparent 1px, transparent 10px), linear-gradient(to bottom, #98e2c6 ${thickness}mm, transparent 1px, transparent 10px)`,
        WebkitOverflowScrolling: 'touch',
      }}
    ></div>
  )
}

export default React.memo(GraphGrid)
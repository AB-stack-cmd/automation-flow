import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';

/**
 * Custom Edge component with primary orange insert button positioned in the middle of the connection wire curve.
 */
export function CustomButtonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeAddClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    if (data?.onAddNodeOnEdge) {
      data.onAddNodeOnEdge(id, { x: labelX, y: labelY });
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: '#201515', ...style }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan z-30"
        >
          <button
            type="button"
            onClick={onEdgeAddClick}
            className="group flex items-center justify-center w-6 h-6 rounded-full bg-[#ff4f00] border-2 border-[#fffefb] text-[#fffefb] hover:scale-110 transition-all duration-150 cursor-pointer shadow-md"
            title="Insert node here"
          >
            <span className="text-xs font-bold transition-transform duration-200 group-hover:rotate-90">
              +
            </span>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default CustomButtonEdge;


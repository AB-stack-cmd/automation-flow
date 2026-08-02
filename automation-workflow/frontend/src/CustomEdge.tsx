import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';

/**
 * Custom Edge component with a subtle, minimal "+" button positioned in the middle of the connection wire curve.
 * Clicking opens the node palette modal to insert a chosen node into the connection.
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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: '#525252', ...style }} />
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
            className="group flex items-center justify-center w-5 h-5 rounded-full bg-[#18181b] border border-neutral-700/80 text-neutral-400 hover:bg-[#27272a] hover:text-white hover:border-neutral-500 transition-all duration-150 cursor-pointer shadow-sm"
            title="Insert node from palette"
          >
            <span className="material-symbols-outlined text-[12px] font-bold transition-transform duration-200 group-hover:rotate-90">
              add
            </span>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const edgeTypes = {
  buttonEdge: CustomButtonEdge,
  default: CustomButtonEdge
};

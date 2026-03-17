import { useCallback, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useReactFlow,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useQuestStore        from '../store/questStore.js';
import { reactFlowNodeTypes } from '../nodes/NodeRegistry.js';
import NodeRegistry          from '../nodes/NodeRegistry.js';

// ---------------------------------------------------------------------------
// Connection validation helpers
// ---------------------------------------------------------------------------

function hasLoop(source, target) {
    return source === target;
}

function hasDuplicateSourceHandle(edges, connection) {
    // Allow multiple edges from the same sourceHandle only for dynamicSources nodes
    const def = NodeRegistry[connection.sourceNode?.type];
    if (def?.handles?.dynamicSources) return false;
    return edges.some(
        e => e.source === connection.source && e.sourceHandle === connection.sourceHandle,
    );
}

function isEndNode(nodeType) {
    return nodeType === 'end';
}

// ---------------------------------------------------------------------------
// QuestGraph
// ---------------------------------------------------------------------------

export default function QuestGraph() {
    const nodes          = useQuestStore(s => s.nodes);
    const edges          = useQuestStore(s => s.edges);
    const onNodesChange  = useQuestStore(s => s.onNodesChange);
    const onEdgesChange  = useQuestStore(s => s.onEdgesChange);
    const onConnect      = useQuestStore(s => s.onConnect);
    const setSelectedNode = useQuestStore(s => s.setSelectedNode);
    const addNode        = useQuestStore(s => s.addNode);

    const { screenToFlowPosition } = useReactFlow();
    const reactFlowWrapper = useRef(null);

    // -----------------------------------------------------------------------
    // Connection validation
    // -----------------------------------------------------------------------

    const isValidConnection = useCallback(
        (connection) => {
            if (hasLoop(connection.source, connection.target)) return false;
            if (hasDuplicateSourceHandle(edges, connection)) return false;

            // Find source node to check if it's an end node
            const sourceNode = nodes.find(n => n.id === connection.source);
            if (sourceNode && isEndNode(sourceNode.type)) return false;

            return true;
        },
        [edges, nodes],
    );

    // -----------------------------------------------------------------------
    // Node selection
    // -----------------------------------------------------------------------

    const onNodeClick = useCallback(
        (_event, node) => setSelectedNode(node.id),
        [setSelectedNode],
    );

    const onPaneClick = useCallback(
        () => setSelectedNode(null),
        [setSelectedNode],
    );

    // -----------------------------------------------------------------------
    // Drag-and-drop from NodePalette
    // -----------------------------------------------------------------------

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();
            const nodeType = event.dataTransfer.getData('application/reactflow-nodetype');
            if (!nodeType) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            addNode(nodeType, position);
        },
        [screenToFlowPosition, addNode],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div ref={reactFlowWrapper} className="quest-graph">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={reactFlowNodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                isValidConnection={isValidConnection}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                fitView
                deleteKeyCode="Delete"
                multiSelectionKeyCode="Shift"
            >
                <Background color="#3a3a4a" gap={20} />
                <Controls />
                <MiniMap
                    nodeColor={(n) => {
                        const def = NodeRegistry[n.type];
                        return def?.color ?? '#888';
                    }}
                    style={{ background: '#1e1e2e' }}
                />
                <Panel position="bottom-center">
                    <span className="graph-hint">
                        Drag nodes from palette • Delete to remove • Scroll to zoom
                    </span>
                </Panel>
            </ReactFlow>
        </div>
    );
}

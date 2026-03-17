/**
 * questSerializer.js
 * Converts a quest graph JSON object into React Flow nodes + edges arrays.
 *
 * Supports all node types:
 *   start, end, dialogue, task, choice, flag, item_grant, condition
 *
 * Position strategy (priority):
 *   1. questGraph._editorMeta.positions  — restored from previous edit session
 *   2. BFS layout starting from start_node
 *   3. Unreachable nodes → "orphan column" to the right of the main graph
 */

const COL_SPACING = 280;
const ROW_SPACING = 200;

// Collect all outgoing node IDs for a given node (for BFS traversal)
function getOutgoingIds(node) {
    switch (node.type) {
        case 'start':
        case 'dialogue':
        case 'flag':
        case 'item_grant':
            return node.next ? [node.next] : [];

        case 'task':
            return [node.next_on_success, node.next_on_fail].filter(Boolean);

        case 'choice':
            return (node.options ?? []).map(o => o.next).filter(Boolean);

        case 'condition':
            return [node.true_node, node.false_node].filter(Boolean);

        case 'end':
        default:
            return [];
    }
}

// BFS layout: assigns column/row positions to nodes
function computeBfsLayout(questGraph) {
    const positions  = {};
    const colCounts  = {}; // row counter per column
    const visited    = new Set();
    const queue      = [{ id: questGraph.start_node, col: 0 }];

    while (queue.length) {
        const { id, col } = queue.shift();
        if (!id || visited.has(id)) continue;
        visited.add(id);

        colCounts[col] = (colCounts[col] ?? 0);
        positions[id]  = { x: col * COL_SPACING, y: colCounts[col] * ROW_SPACING };
        colCounts[col]++;

        const node = questGraph.nodes[id];
        if (!node) continue;

        getOutgoingIds(node).forEach(nextId => {
            if (!visited.has(nextId)) {
                queue.push({ id: nextId, col: col + 1 });
            }
        });
    }

    // Orphan nodes (unreachable from start_node) → rightmost column + 2
    const maxCol = Object.keys(colCounts).reduce((m, c) => Math.max(m, Number(c)), 0);
    const orphanX = (maxCol + 2) * COL_SPACING;
    let orphanY = 0;

    Object.keys(questGraph.nodes).forEach(id => {
        if (!positions[id]) {
            positions[id] = { x: orphanX, y: orphanY };
            orphanY += ROW_SPACING;
        }
    });

    return positions;
}

/**
 * Main export.
 * @param {Object} questGraph  Full quest JSON (id, version, start_node, nodes, _editorMeta?)
 * @returns {{ nodes: RFNode[], edges: RFEdge[] }}
 */
export function serializeQuestToFlow(questGraph) {
    const savedPositions = questGraph._editorMeta?.positions ?? {};
    const bfsPositions   = computeBfsLayout(questGraph);

    const rfNodes = [];
    const rfEdges = [];

    Object.entries(questGraph.nodes ?? {}).forEach(([nodeId, node]) => {
        const position = savedPositions[nodeId] ?? bfsPositions[nodeId] ?? { x: 0, y: 0 };

        rfNodes.push({
            id:       nodeId,
            type:     node.type,
            position,
            data:     { ...node },
        });

        // Build edges based on node type
        switch (node.type) {
            case 'start':
            case 'dialogue':
            case 'flag':
            case 'item_grant':
                if (node.next) {
                    rfEdges.push({
                        id:           `e__${nodeId}__next__${node.next}`,
                        source:       nodeId,
                        sourceHandle: 'next',
                        target:       node.next,
                        targetHandle: 'target',
                    });
                }
                break;

            case 'task':
                if (node.next_on_success) {
                    rfEdges.push({
                        id:           `e__${nodeId}__success__${node.next_on_success}`,
                        source:       nodeId,
                        sourceHandle: 'next_on_success',
                        target:       node.next_on_success,
                        targetHandle: 'target',
                        label:        'Success',
                    });
                }
                if (node.next_on_fail) {
                    rfEdges.push({
                        id:           `e__${nodeId}__fail__${node.next_on_fail}`,
                        source:       nodeId,
                        sourceHandle: 'next_on_fail',
                        target:       node.next_on_fail,
                        targetHandle: 'target',
                        label:        'Fail',
                    });
                }
                break;

            case 'choice':
                (node.options ?? []).forEach((opt, idx) => {
                    if (opt.next) {
                        rfEdges.push({
                            id:           `e__${nodeId}__opt${idx}__${opt.next}`,
                            source:       nodeId,
                            sourceHandle: `option_${idx}`,
                            target:       opt.next,
                            targetHandle: 'target',
                            label:        opt.label ?? `Option ${idx + 1}`,
                        });
                    }
                });
                break;

            case 'condition':
                if (node.true_node) {
                    rfEdges.push({
                        id:           `e__${nodeId}__true__${node.true_node}`,
                        source:       nodeId,
                        sourceHandle: 'true_node',
                        target:       node.true_node,
                        targetHandle: 'target',
                        label:        'True',
                    });
                }
                if (node.false_node) {
                    rfEdges.push({
                        id:           `e__${nodeId}__false__${node.false_node}`,
                        source:       nodeId,
                        sourceHandle: 'false_node',
                        target:       node.false_node,
                        targetHandle: 'target',
                        label:        'False',
                    });
                }
                break;

            default:
                break;
        }
    });

    return { nodes: rfNodes, edges: rfEdges };
}

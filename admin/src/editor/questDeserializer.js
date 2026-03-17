/**
 * questDeserializer.js
 * Converts React Flow nodes + edges back into a quest graph JSON object.
 *
 * KEY PRINCIPLE:
 *   The edge list is the single source of truth for all connections.
 *   Values such as `next`, `next_on_success`, `true_node` etc. stored in
 *   rfNode.data are IGNORED and recomputed from the edge list.
 *   This prevents stale pointers after an edge is deleted on the canvas.
 *
 * Node positions are preserved in _editorMeta.positions so the next
 * serializeQuestToFlow() call can restore the exact layout.
 * The QuestEngine ignores _editorMeta (it only reads id, version,
 * start_node, nodes).
 */

/**
 * @param {RFNode[]} rfNodes
 * @param {RFEdge[]} rfEdges
 * @param {{ id: string, version: number }} meta
 * @returns {Object}  quest graph JSON
 */
export function deserializeFlowToQuest(rfNodes, rfEdges, meta) {
    // Build edge lookup:  "sourceNodeId::sourceHandleId" → targetNodeId
    const edgeMap = {};
    rfEdges.forEach(edge => {
        const key       = `${edge.source}::${edge.sourceHandle}`;
        edgeMap[key]    = edge.target;
    });

    const nodes     = {};
    const positions = {};

    rfNodes.forEach(rfNode => {
        const { id, type, data, position } = rfNode;
        positions[id] = position;

        // Clone data, ensure type is set correctly
        const nodeData = { ...data, type };

        // Recompute all connection fields from edges (ignore stored values)
        switch (type) {
            case 'start':
            case 'dialogue':
            case 'flag':
            case 'item_grant':
                nodeData.next = edgeMap[`${id}::next`] ?? null;
                break;

            case 'task':
                nodeData.next_on_success = edgeMap[`${id}::next_on_success`] ?? null;
                nodeData.next_on_fail    = edgeMap[`${id}::next_on_fail`]    ?? null;
                break;

            case 'choice':
                // Preserve option label/order from data; update `next` from edges
                nodeData.options = (nodeData.options ?? []).map((opt, idx) => ({
                    ...opt,
                    next: edgeMap[`${id}::option_${idx}`] ?? null,
                }));
                break;

            case 'condition':
                nodeData.true_node  = edgeMap[`${id}::true_node`]  ?? null;
                nodeData.false_node = edgeMap[`${id}::false_node`]  ?? null;
                break;

            case 'end':
                // no outgoing edges
                break;

            default:
                break;
        }

        nodes[id] = nodeData;
    });

    // start_node: first node of type 'start', fallback to first node
    const startNode = rfNodes.find(n => n.type === 'start');
    const start_node = startNode?.id ?? rfNodes[0]?.id ?? null;

    return {
        id:          meta.id,
        version:     meta.version,
        start_node,
        nodes,
        _editorMeta: { positions },
    };
}

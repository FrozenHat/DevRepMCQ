/**
 * QuestEngine
 *
 * Client-side interpreter for the graph-based quest model.
 *
 * Execution model (hybrid):
 *
 *   - Auto-nodes (flag, item_grant, condition) are resolved immediately
 *     on the client using the local context object.  No server round-trip
 *     is needed because the logic is purely deterministic flag / inventory
 *     manipulation.
 *
 *   - Blocking nodes (dialogue, choice) halt execution and return control
 *     to the caller, which presents them via DialogSystem.
 *
 *   - End nodes mark the quest as complete and resolve the current session.
 *
 *   - After each blocking node is resolved (player acts), the engine
 *     optionally persists progress to the API (best-effort, non-blocking).
 *
 * The engine does NOT evaluate arbitrary code from quest data.
 * All branching is handled through explicit switch/case on node.type.
 */

export default class QuestEngine {
    /**
     * @param {Object}     questGraph      Full published quest object from API.
     * @param {Object}     initialContext  Starting context (flags, inventory, …).
     * @param {ApiClient|null} apiClient   For persisting progress. Optional.
     */
    constructor(questGraph, initialContext = {}, apiClient = null) {
        this.graph = questGraph;
        this.context = { inventory: [], ...initialContext };
        this.currentNodeId = questGraph.start_node;
        this.api = apiClient;
        this.finished = false;
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Returns the next node that requires player interaction (dialogue, choice,
     * or end), resolving all auto-nodes along the way.
     *
     * Call this once after construction to get the first interactive node,
     * and again after each player action via advance().
     *
     * @returns {Promise<Object|null>}  Node object, or null if graph is exhausted.
     */
    async resolveToInteractable() {
        while (true) {
            const node = this._currentNode();
            if (!node) return null;

            if (this._isAutoNode(node.type)) {
                this._executeAutoNode(node);
                // _executeAutoNode updates this.currentNodeId synchronously
            } else {
                return node;
            }
        }
    }

    /**
     * Advances the engine past a blocking node based on the player's action.
     *
     *   - dialogue nodes: choiceIndex is ignored; the single `next` edge is taken.
     *   - choice nodes: choiceIndex selects which option edge to follow.
     *   - end nodes: no advance is possible; call isFinished() to detect this.
     *
     * @param {number} choiceIndex  Selected option index (for choice nodes).
     * @returns {Promise<Object|null>}  Next interactive node, or null on end.
     */
    async advance(choiceIndex = 0) {
        const node = this._currentNode();
        if (!node || this.finished) return null;

        switch (node.type) {
            case 'dialogue':
                this.currentNodeId = node.next ?? null;
                break;

            case 'choice': {
                const option = node.options?.[choiceIndex];
                if (!option) {
                    console.warn(`QuestEngine: choice index ${choiceIndex} out of range`);
                    return null;
                }
                this.currentNodeId = option.next ?? null;
                break;
            }

            case 'end':
                this.finished = true;
                this._persistProgress('completed');
                return node;

            default:
                console.warn(`QuestEngine: advance() called on non-blocking node type "${node.type}"`);
                break;
        }

        const next = await this.resolveToInteractable();

        if (!next || next.type === 'end') {
            this.finished = true;
            this._persistProgress(next?.outcome === 'abandoned' ? 'abandoned' : 'completed');
        } else {
            this._persistProgress('in_progress');
        }

        return next;
    }

    isFinished() {
        return this.finished;
    }

    getContext() {
        return { ...this.context };
    }

    getCurrentNodeId() {
        return this.currentNodeId;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    _currentNode() {
        if (!this.currentNodeId) return null;
        const node = this.graph.nodes[this.currentNodeId];
        if (!node) {
            console.error(`QuestEngine: node "${this.currentNodeId}" not found in graph`);
            return null;
        }
        return node;
    }

    _isAutoNode(type) {
        return type === 'flag' || type === 'item_grant' || type === 'condition';
    }

    /**
     * Executes a single auto-node and updates currentNodeId.
     * All operations are synchronous and deterministic.
     * No eval / no dynamic code execution.
     *
     * @param {Object} node
     */
    _executeAutoNode(node) {
        switch (node.type) {
            case 'flag':
                this.context[node.flag_key] = node.flag_value !== undefined ? node.flag_value : true;
                this.currentNodeId = node.next ?? null;
                break;

            case 'item_grant':
                if (!Array.isArray(this.context.inventory)) {
                    this.context.inventory = [];
                }
                if (node.item_id && !this.context.inventory.includes(node.item_id)) {
                    this.context.inventory.push(node.item_id);
                }
                this.currentNodeId = node.next ?? null;
                break;

            case 'condition': {
                const { flag, equals } = node.condition ?? {};
                const actual = this.context[flag];
                const passes = actual === equals;
                this.currentNodeId = passes ? node.true_node : node.false_node;
                break;
            }

            default:
                console.warn(`QuestEngine: unknown auto-node type "${node.type}"`);
                this.currentNodeId = null;
        }
    }

    _persistProgress(status) {
        if (!this.api || !this.graph.id) return;
        // Fire-and-forget; do not await — progress save must not gate gameplay.
        this.api.savePlayerProgress(
            this.graph.id,
            this.currentNodeId,
            this.context,
            status
        ).catch(() => {
            // Silently ignore; progress will be re-saved on next advance.
        });
    }
}

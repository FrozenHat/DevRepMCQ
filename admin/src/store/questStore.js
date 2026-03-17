import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { serializeQuestToFlow }   from '../editor/questSerializer.js';
import { deserializeFlowToQuest } from '../editor/questDeserializer.js';
import NodeRegistry               from '../nodes/NodeRegistry.js';
import * as questApi              from '../api/questApi.js';

const AUTO_SAVE_DELAY = 1500;

const useQuestStore = create((set, get) => ({
    // Quest metadata
    questId:       null,
    questSlug:     null,
    versionId:     null,
    versionNumber: null,
    versionStatus: null, // 'draft' | 'published' | 'archived'

    // UI state
    isSaving:       false,
    isPublishing:   false,
    saveError:      null,
    selectedNodeId: null,

    // React Flow state
    nodes: [],
    edges: [],

    // Internal
    _saveTimer: null,

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------

    /** Load quest from API: fetch versions → prefer draft → serialize to RF */
    async loadQuest(questId, questSlug) {
        try {
            const versions = await questApi.getVersions(questId);
            const target   = versions.find(v => v.status === 'draft') ?? versions[0];
            if (!target) return;

            // The API returns quest_versions rows; the graph is in target.data
            const questGraph = target.data ?? { id: questSlug, version: target.version_number, start_node: null, nodes: {} };
            const { nodes, edges } = serializeQuestToFlow(questGraph);

            set({
                questId,
                questSlug,
                versionId:     target.id,
                versionNumber: target.version_number,
                versionStatus: target.status,
                nodes,
                edges,
                selectedNodeId: null,
                saveError:      null,
            });
        } catch (err) {
            console.error('loadQuest failed:', err);
        }
    },

    /** Load from a quest JSON object directly (e.g. imported file) */
    loadFromJson(questGraph) {
        const { nodes, edges } = serializeQuestToFlow(questGraph);
        set({
            questSlug:     questGraph.id,
            versionNumber: questGraph.version ?? 1,
            nodes,
            edges,
            selectedNodeId: null,
            saveError:      null,
        });
    },

    /** React Flow change handlers */
    onNodesChange(changes) {
        set(s => ({ nodes: applyNodeChanges(changes, s.nodes) }));
        get()._scheduleSave();
    },

    onEdgesChange(changes) {
        set(s => ({ edges: applyEdgeChanges(changes, s.edges) }));
        get()._scheduleSave();
    },

    onConnect(connection) {
        set(s => ({ edges: addEdge({ ...connection, type: 'default' }, s.edges) }));
        get()._scheduleSave();
    },

    /** Called by NodeInspector when a field changes */
    updateNodeData(nodeId, patch) {
        set(s => ({
            nodes: s.nodes.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
            ),
        }));
        get()._scheduleSave();
    },

    setSelectedNode(nodeId) {
        set({ selectedNodeId: nodeId });
    },

    /** Called from NodePalette (drag-drop or click) */
    addNode(type, position) {
        const def = NodeRegistry[type];
        if (!def) return;
        const id      = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newNode = { id, type, position, data: { ...def.defaultData } };
        set(s => ({ nodes: [...s.nodes, newNode] }));
        get()._scheduleSave();
    },

    async saveDraft() {
        const { questId, questSlug, versionNumber, nodes, edges } = get();
        if (!questId) return; // not connected to API — skip silently

        const questGraph = deserializeFlowToQuest(nodes, edges, {
            id:      questSlug,
            version: versionNumber ?? 1,
        });

        set({ isSaving: true, saveError: null });
        try {
            const version = await questApi.saveDraft(questId, questGraph);
            set({
                isSaving:      false,
                versionId:     version.id,
                versionNumber: version.version_number,
                versionStatus: version.status,
            });
        } catch (err) {
            set({ isSaving: false, saveError: err.message });
        }
    },

    async publishVersion() {
        const { questId, versionId } = get();
        if (!questId || !versionId) return;
        set({ isPublishing: true });
        try {
            const version = await questApi.publishVersion(questId, versionId);
            set({ isPublishing: false, versionStatus: version.status });
        } catch (err) {
            set({ isPublishing: false });
            console.error('Publish failed:', err);
        }
    },

    /** Export current graph as downloadable JSON */
    exportJson() {
        const { nodes, edges, questSlug, versionNumber } = get();
        return deserializeFlowToQuest(nodes, edges, {
            id:      questSlug ?? 'untitled',
            version: versionNumber ?? 1,
        });
    },

    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------

    _scheduleSave() {
        const { _saveTimer } = get();
        if (_saveTimer) clearTimeout(_saveTimer);
        const timer = setTimeout(() => get().saveDraft(), AUTO_SAVE_DELAY);
        set({ _saveTimer: timer });
    },
}));

export default useQuestStore;

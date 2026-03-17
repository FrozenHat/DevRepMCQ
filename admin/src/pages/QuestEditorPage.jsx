import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import useQuestStore  from '../store/questStore.js';
import QuestGraph     from '../editor/QuestGraph.jsx';
import NodeInspector  from '../editor/NodeInspector.jsx';
import NodePalette    from '../editor/NodePalette.jsx';
import EditorToolbar  from '../editor/EditorToolbar.jsx';

export default function QuestEditorPage({ questId, questSlug, onBack }) {
    const loadQuest   = useQuestStore(s => s.loadQuest);

    useEffect(() => {
        if (questId) {
            loadQuest(questId, questSlug);
        }
    }, [questId, questSlug]);

    return (
        <div className="quest-editor-page">
            <EditorToolbar onBack={onBack} />

            <div className="editor-layout">
                <NodePalette />

                <ReactFlowProvider>
                    <QuestGraph />
                </ReactFlowProvider>

                <NodeInspector />
            </div>
        </div>
    );
}

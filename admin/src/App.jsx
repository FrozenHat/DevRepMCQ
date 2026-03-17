import { useState } from 'react';
import useAuthStore      from './store/authStore.js';
import LoginPage         from './pages/LoginPage.jsx';
import QuestListPage     from './pages/QuestListPage.jsx';
import QuestEditorPage   from './pages/QuestEditorPage.jsx';

/**
 * 3-state view machine: 'login' → 'list' → 'editor'
 * No router library required.
 */
export default function App() {
    const isLoggedIn = useAuthStore(s => s.isLoggedIn);

    const [view, setView]      = useState('list'); // 'list' | 'editor'
    const [questId, setQuestId]   = useState(null);
    const [questSlug, setQuestSlug] = useState(null);

    if (!isLoggedIn) {
        return <LoginPage />;
    }

    if (view === 'editor') {
        return (
            <QuestEditorPage
                questId={questId}
                questSlug={questSlug}
                onBack={() => setView('list')}
            />
        );
    }

    return (
        <QuestListPage
            onSelectQuest={(id, slug) => {
                setQuestId(id);
                setQuestSlug(slug);
                setView('editor');
            }}
        />
    );
}

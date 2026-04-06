import { useState } from 'react';
import useAuthStore      from './store/authStore.js';
import LoginPage         from './pages/LoginPage.jsx';
import QuestListPage     from './pages/QuestListPage.jsx';
import QuestEditorPage   from './pages/QuestEditorPage.jsx';
import SceneEditorPage   from './pages/SceneEditorPage.jsx';
import CharactersPage    from './pages/CharactersPage.jsx';
import ItemsPage         from './pages/ItemsPage.jsx';

const TABS = [
    { key: 'quests',     label: 'Квесты'       },
    { key: 'scene',      label: 'Scene Editor'  },
    { key: 'characters', label: 'Персонажи'     },
    { key: 'items',      label: 'Предметы'      },
];

export default function App() {
    const isLoggedIn = useAuthStore(s => s.isLoggedIn);
    const logout     = useAuthStore(s => s.logout);

    const [tab,       setTab]       = useState('quests');
    const [view,      setView]      = useState('list');
    const [questId,   setQuestId]   = useState(null);
    const [questSlug, setQuestSlug] = useState(null);

    if (!isLoggedIn) return <LoginPage />;

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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <nav className="app-nav">
                <div className="app-nav__tabs">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            className={`app-nav__tab${tab === t.key ? ' app-nav__tab--active' : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <button className="app-nav__logout" onClick={logout}>Выйти</button>
            </nav>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {tab === 'quests' && (
                    <QuestListPage
                        onSelectQuest={(id, slug) => { setQuestId(id); setQuestSlug(slug); setView('editor'); }}
                        hideLogout
                    />
                )}
                {tab === 'scene'      && <SceneEditorPage />}
                {tab === 'characters' && <CharactersPage />}
                {tab === 'items'      && <ItemsPage />}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import useAuthStore  from '../store/authStore.js';
import * as questApi from '../api/questApi.js';

export default function QuestListPage({ onSelectQuest }) {
    const logout = useAuthStore(s => s.logout);

    const [quests,  setQuests]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newSlug,  setNewSlug]  = useState('');

    useEffect(() => {
        loadQuests();
    }, []);

    async function loadQuests() {
        setLoading(true);
        setError(null);
        try {
            const data = await questApi.listQuests();
            setQuests(data);
        } catch (err) {
            setError(err.message ?? 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!newTitle.trim() || !newSlug.trim()) return;
        try {
            const quest = await questApi.createQuest(newTitle.trim(), newSlug.trim());
            setCreating(false);
            setNewTitle('');
            setNewSlug('');
            setQuests(prev => [quest, ...prev]);
        } catch (err) {
            alert(`Ошибка создания: ${err.message}`);
        }
    }

    return (
        <div className="quest-list-page">
            <header className="ql-header">
                <h1 className="ql-title">Квесты</h1>
                <div className="ql-header-actions">
                    <button
                        className="ql-btn ql-btn--primary"
                        onClick={() => setCreating(c => !c)}
                    >
                        {creating ? 'Отмена' : '+ Новый квест'}
                    </button>
                    <button className="ql-btn ql-btn--ghost" onClick={logout}>
                        Выйти
                    </button>
                </div>
            </header>

            {creating && (
                <form className="ql-create-form" onSubmit={handleCreate}>
                    <input
                        className="ql-input"
                        type="text"
                        placeholder="Название квеста"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        required
                    />
                    <input
                        className="ql-input"
                        type="text"
                        placeholder="slug (без пробелов, латиница)"
                        value={newSlug}
                        pattern="[a-z0-9_-]+"
                        onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        required
                    />
                    <button className="ql-btn ql-btn--primary" type="submit">
                        Создать
                    </button>
                </form>
            )}

            {loading && <p className="ql-state">Загрузка…</p>}
            {error   && <p className="ql-state ql-state--error">{error}</p>}

            {!loading && !error && quests.length === 0 && (
                <p className="ql-state">Нет квестов. Создайте первый.</p>
            )}

            <ul className="ql-list">
                {quests.map(q => (
                    <li key={q.id} className="ql-item">
                        <div className="ql-item__info">
                            <span className="ql-item__title">{q.title}</span>
                            <span className="ql-item__slug">{q.slug}</span>
                        </div>
                        <button
                            className="ql-btn ql-btn--secondary"
                            onClick={() => onSelectQuest(q.id, q.slug)}
                        >
                            Редактировать
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

import { useState, useEffect } from 'react';
import * as charactersApi from '../api/charactersApi.js';

const ROLE_LABELS = {
    npc:       'NPC',
    merchant:  'Торговец',
    enemy:     'Враг',
    companion: 'Компаньон',
    boss:      'Босс',
};

const EMPTY_FORM = { name: '', role: 'npc', description: '', sprite: '' };

export default function CharactersPage() {
    const [chars,   setChars]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal,   setModal]   = useState(null); // null | 'create' | character object
    const [form,    setForm]    = useState(EMPTY_FORM);
    const [saving,  setSaving]  = useState(false);

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try { setChars(await charactersApi.listCharacters()); }
        finally { setLoading(false); }
    }

    function openCreate() { setForm(EMPTY_FORM); setModal('create'); }
    function openEdit(c)  { setForm({ name: c.name, role: c.role, description: c.description ?? '', sprite: c.sprite ?? '' }); setModal(c); }
    function closeModal() { setModal(null); }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (modal === 'create') {
                const c = await charactersApi.createCharacter(form);
                setChars(prev => [c, ...prev]);
            } else {
                const c = await charactersApi.updateCharacter(modal.id, form);
                setChars(prev => prev.map(x => x.id === c.id ? c : x));
            }
            closeModal();
        } finally { setSaving(false); }
    }

    async function handleDelete(id) {
        if (!confirm('Удалить персонажа?')) return;
        await charactersApi.deleteCharacter(id);
        setChars(prev => prev.filter(c => c.id !== id));
    }

    return (
        <div className="entity-page">
            <header className="ql-header">
                <h1 className="ql-title">Персонажи</h1>
                <button className="ql-btn ql-btn--primary" onClick={openCreate}>+ Новый персонаж</button>
            </header>

            {loading && <p className="ql-state">Загрузка…</p>}

            {!loading && chars.length === 0 && (
                <p className="ql-state">Нет персонажей. Создайте первого.</p>
            )}

            <div className="entity-grid">
                {chars.map(c => (
                    <div key={c.id} className="entity-card">
                        <div className="entity-card__avatar">
                            {c.sprite
                                ? <img src={c.sprite} alt={c.name} className="entity-card__img" />
                                : <span className="entity-card__placeholder">👤</span>
                            }
                        </div>
                        <div className="entity-card__body">
                            <div className="entity-card__name">{c.name}</div>
                            <div className="entity-card__meta">{ROLE_LABELS[c.role] ?? c.role}</div>
                            {c.description && <div className="entity-card__desc">{c.description}</div>}
                        </div>
                        <div className="entity-card__actions">
                            <button className="ql-btn ql-btn--secondary" onClick={() => openEdit(c)}>Изменить</button>
                            <button className="ql-btn ql-btn--danger"    onClick={() => handleDelete(c.id)}>Удалить</button>
                        </div>
                    </div>
                ))}
            </div>

            {modal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-card">
                        <h2>{modal === 'create' ? 'Новый персонаж' : 'Редактировать персонажа'}</h2>
                        <form onSubmit={handleSave} className="entity-form">
                            <label className="entity-form__field">
                                <span>Имя *</span>
                                <input className="ql-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                            </label>
                            <label className="entity-form__field">
                                <span>Роль</span>
                                <select className="ql-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                                    {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </label>
                            <label className="entity-form__field">
                                <span>Описание</span>
                                <textarea className="ql-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </label>
                            <label className="entity-form__field">
                                <span>URL спрайта</span>
                                <input className="ql-input" placeholder="https://..." value={form.sprite} onChange={e => setForm(f => ({ ...f, sprite: e.target.value }))} />
                            </label>
                            <div className="modal-actions">
                                <button type="button" className="ql-btn ql-btn--ghost" onClick={closeModal}>Отмена</button>
                                <button type="submit" className="ql-btn ql-btn--primary" disabled={saving}>
                                    {saving ? 'Сохранение…' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

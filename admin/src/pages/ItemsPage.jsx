import { useState, useEffect } from 'react';
import * as itemsApi from '../api/itemsApi.js';

const TYPE_LABELS = {
    quest:      'Квестовый',
    weapon:     'Оружие',
    consumable: 'Расходник',
    key:        'Ключ',
    misc:       'Разное',
};

const EMPTY_FORM = { name: '', type: 'quest', description: '', icon: '' };

export default function ItemsPage() {
    const [items,   setItems]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal,   setModal]   = useState(null); // null | 'create' | item object
    const [form,    setForm]    = useState(EMPTY_FORM);
    const [saving,  setSaving]  = useState(false);

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try { setItems(await itemsApi.listItems()); }
        finally { setLoading(false); }
    }

    function openCreate() { setForm(EMPTY_FORM); setModal('create'); }
    function openEdit(it) { setForm({ name: it.name, type: it.type, description: it.description ?? '', icon: it.icon ?? '' }); setModal(it); }
    function closeModal() { setModal(null); }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (modal === 'create') {
                const it = await itemsApi.createItem(form);
                setItems(prev => [it, ...prev]);
            } else {
                const it = await itemsApi.updateItem(modal.id, form);
                setItems(prev => prev.map(x => x.id === it.id ? it : x));
            }
            closeModal();
        } finally { setSaving(false); }
    }

    async function handleDelete(id) {
        if (!confirm('Удалить предмет?')) return;
        await itemsApi.deleteItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
    }

    return (
        <div className="entity-page">
            <header className="ql-header">
                <h1 className="ql-title">Предметы</h1>
                <button className="ql-btn ql-btn--primary" onClick={openCreate}>+ Новый предмет</button>
            </header>

            {loading && <p className="ql-state">Загрузка…</p>}

            {!loading && items.length === 0 && (
                <p className="ql-state">Нет предметов. Создайте первый.</p>
            )}

            <div className="entity-grid">
                {items.map(it => (
                    <div key={it.id} className="entity-card">
                        <div className="entity-card__avatar">
                            {it.icon
                                ? <img src={it.icon} alt={it.name} className="entity-card__img" />
                                : <span className="entity-card__placeholder">◆</span>
                            }
                        </div>
                        <div className="entity-card__body">
                            <div className="entity-card__name">{it.name}</div>
                            <div className="entity-card__meta">{TYPE_LABELS[it.type] ?? it.type}</div>
                            {it.description && <div className="entity-card__desc">{it.description}</div>}
                        </div>
                        <div className="entity-card__actions">
                            <button className="ql-btn ql-btn--secondary" onClick={() => openEdit(it)}>Изменить</button>
                            <button className="ql-btn ql-btn--danger"    onClick={() => handleDelete(it.id)}>Удалить</button>
                        </div>
                    </div>
                ))}
            </div>

            {modal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-card">
                        <h2>{modal === 'create' ? 'Новый предмет' : 'Редактировать предмет'}</h2>
                        <form onSubmit={handleSave} className="entity-form">
                            <label className="entity-form__field">
                                <span>Название *</span>
                                <input className="ql-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                            </label>
                            <label className="entity-form__field">
                                <span>Тип</span>
                                <select className="ql-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </label>
                            <label className="entity-form__field">
                                <span>Описание</span>
                                <textarea className="ql-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </label>
                            <label className="entity-form__field">
                                <span>URL иконки</span>
                                <input className="ql-input" placeholder="https://..." value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
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

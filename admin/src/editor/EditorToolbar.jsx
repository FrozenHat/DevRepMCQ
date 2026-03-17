import { useRef } from 'react';
import useQuestStore from '../store/questStore.js';

export default function EditorToolbar({ onBack }) {
    const importRef = useRef(null);
    const questSlug     = useQuestStore(s => s.questSlug);
    const versionNumber = useQuestStore(s => s.versionNumber);
    const versionStatus = useQuestStore(s => s.versionStatus);
    const isSaving      = useQuestStore(s => s.isSaving);
    const isPublishing  = useQuestStore(s => s.isPublishing);
    const saveError     = useQuestStore(s => s.saveError);
    const saveDraft      = useQuestStore(s => s.saveDraft);
    const publishVersion = useQuestStore(s => s.publishVersion);
    const exportJson     = useQuestStore(s => s.exportJson);
    const loadFromJson   = useQuestStore(s => s.loadFromJson);

    function handleImport() {
        importRef.current?.click();
    }

    function handleImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const graph = JSON.parse(ev.target.result);
                loadFromJson(graph);
            } catch {
                alert('Невалидный JSON файл');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function handleSave() {
        saveDraft();
    }

    function handlePublish() {
        if (!window.confirm('Опубликовать версию? Текущий черновик заменит активную публичную версию.')) return;
        publishVersion();
    }

    function handleExport() {
        const graph = exportJson();
        const blob  = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' });
        const url   = URL.createObjectURL(blob);
        const a     = document.createElement('a');
        a.href      = url;
        a.download  = `${graph.id ?? 'quest'}_v${graph.version ?? 1}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const statusClass = `toolbar-status toolbar-status--${versionStatus ?? 'none'}`;

    return (
        <div className="editor-toolbar">
            <div className="toolbar-left">
                <button className="toolbar-btn toolbar-btn--back" onClick={onBack}>
                    ← Квесты
                </button>
                <span className="toolbar-quest-name">{questSlug ?? '—'}</span>
            </div>

            <div className="toolbar-center">
                {versionNumber && (
                    <span className="toolbar-version">v{versionNumber}</span>
                )}
                <span className={statusClass}>
                    {versionStatus ?? 'не сохранено'}
                </span>
                {isSaving && <span className="toolbar-saving">Сохранение…</span>}
                {saveError && <span className="toolbar-error" title={saveError}>Ошибка сохранения</span>}
            </div>

            <div className="toolbar-right">
                <input
                    ref={importRef}
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={handleImportFile}
                />
                <button
                    className="toolbar-btn toolbar-btn--ghost"
                    onClick={handleImport}
                    title="Загрузить quest JSON"
                >
                    Импорт JSON
                </button>
                <button
                    className="toolbar-btn toolbar-btn--secondary"
                    onClick={handleExport}
                    title="Скачать quest JSON"
                >
                    Экспорт JSON
                </button>
                <button
                    className="toolbar-btn toolbar-btn--secondary"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Сохранение…' : 'Сохранить'}
                </button>
                <button
                    className="toolbar-btn toolbar-btn--primary"
                    onClick={handlePublish}
                    disabled={isPublishing || versionStatus === 'published'}
                    title={versionStatus === 'published' ? 'Уже опубликовано' : 'Опубликовать'}
                >
                    {isPublishing ? 'Публикация…' : 'Опубликовать'}
                </button>
            </div>
        </div>
    );
}

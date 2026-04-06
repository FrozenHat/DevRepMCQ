import { useState, useEffect } from 'react';
import * as locationsApi from '../api/locationsApi.js';
import useQuestStore from '../store/questStore.js';

// ----------------------------------------------------------------
// ACTION_REGISTRY — add new element types here, no component changes
// ----------------------------------------------------------------
const ACTION_REGISTRY = {
    location: {
        label:    'Локация',
        color:    '#58a6ff',
        icon:     '🗺',
        loadList: () => locationsApi.listLocations(),
        actions: {
            teleport_to: {
                label:       'Перейти в локацию',
                description: 'Телепортировать игрока — квест продолжается в новой локации',
                params:      [],
            },
        },
    },
};

// ----------------------------------------------------------------
// ActionEditor
// ----------------------------------------------------------------
export default function ActionEditor({ nodeId, data }) {
    const updateNodeData = useQuestStore(s => s.updateNodeData);

    const [elements, setElements] = useState([]);
    const [loading,  setLoading]  = useState(false);

    const elementType = data.element_type ?? null;
    const elementId   = data.element_id   ?? null;
    const action      = data.action       ?? null;

    useEffect(() => {
        if (!elementType || !ACTION_REGISTRY[elementType]) { setElements([]); return; }
        setLoading(true);
        ACTION_REGISTRY[elementType].loadList()
            .then(list => setElements(list))
            .catch(() => setElements([]))
            .finally(() => setLoading(false));
    }, [elementType]);

    function patch(fields) {
        updateNodeData(nodeId, { ...data, ...fields });
    }

    function selectType(type) {
        patch({ element_type: type, element_id: null, element_name: null, action: null, params: {} });
    }

    function selectElement(id) {
        const el = elements.find(e => e.id === id);
        patch({ element_id: id || null, element_name: el?.name ?? null, action: null });
    }

    function selectAction(key) {
        const lbl = key && typeDef?.actions[key]?.label;
        patch({ action: key || null, action_label: lbl ?? null });
    }

    const typeDef    = elementType ? ACTION_REGISTRY[elementType] : null;
    const elementObj = elements.find(e => e.id === elementId);
    const actionDef  = typeDef && action ? typeDef.actions[action] : null;

    return (
        <div className="ae-editor">

            {/* Step 1 — element type */}
            <div className="inspector__label ae-section-label">ТИП ЭЛЕМЕНТА</div>
            <div className="ae-type-grid">
                {Object.entries(ACTION_REGISTRY).map(([key, def]) => (
                    <button
                        key={key}
                        className={`ae-type-card${elementType === key ? ' ae-type-card--active' : ''}`}
                        style={elementType === key ? { borderColor: def.color, color: def.color } : {}}
                        onClick={() => selectType(key)}
                    >
                        <span className="ae-type-icon">{def.icon}</span>
                        <span className="ae-type-name">{def.label}</span>
                    </button>
                ))}
            </div>

            {/* Step 2 — pick specific element */}
            {typeDef && (
                <>
                    <div className="inspector__label ae-section-label" style={{ marginTop: 10 }}>
                        ЭЛЕМЕНТ
                    </div>
                    {loading && <div className="ae-hint">Загрузка…</div>}
                    {!loading && elements.length === 0 && (
                        <div className="ae-hint">Нет элементов. Создайте локацию в Scene Editor.</div>
                    )}
                    {!loading && elements.length > 0 && (
                        <select
                            className="inspector-select"
                            value={elementId ?? ''}
                            onChange={e => selectElement(e.target.value)}
                        >
                            <option value="">— выберите —</option>
                            {elements.map(el => (
                                <option key={el.id} value={el.id}>{el.name}</option>
                            ))}
                        </select>
                    )}
                </>
            )}

            {/* Step 3 — pick action */}
            {typeDef && elementId && (
                <>
                    <div className="inspector__label ae-section-label" style={{ marginTop: 10 }}>
                        ДЕЙСТВИЕ
                    </div>
                    <select
                        className="inspector-select"
                        value={action ?? ''}
                        onChange={e => selectAction(e.target.value)}
                    >
                        <option value="">— выберите —</option>
                        {Object.entries(typeDef.actions).map(([key, def]) => (
                            <option key={key} value={key}>{def.label}</option>
                        ))}
                    </select>
                    {actionDef?.description && (
                        <div className="ae-action-desc">{actionDef.description}</div>
                    )}
                </>
            )}

            {/* Summary badge */}
            {actionDef && elementObj && (
                <div className="ae-summary" style={{ borderColor: typeDef.color }}>
                    <span className="ae-summary__icon">{typeDef.icon}</span>
                    <span className="ae-summary__text">
                        {elementObj.name} → {actionDef.label}
                    </span>
                </div>
            )}
        </div>
    );
}

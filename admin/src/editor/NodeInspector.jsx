import useQuestStore  from '../store/questStore.js';
import NodeRegistry   from '../nodes/NodeRegistry.js';
import DialogueEditor from './DialogueEditor.jsx';
import ChoiceEditor   from './ChoiceEditor.jsx';
import ActionEditor   from './ActionEditor.jsx';

// ---------------------------------------------------------------------------
// Generic field renderer
// ---------------------------------------------------------------------------

/**
 * Read/write a value at a dot-path like 'rewards.points' inside `data`.
 */
function getPath(obj, path) {
    return path.split('.').reduce((cur, key) => cur?.[key], obj);
}

function setPath(obj, path, value) {
    const keys = path.split('.');
    const result = { ...obj };
    let ref = result;
    for (let i = 0; i < keys.length - 1; i++) {
        ref[keys[i]] = { ...ref[keys[i]] };
        ref = ref[keys[i]];
    }
    ref[keys[keys.length - 1]] = value;
    return result;
}

function FieldEditor({ field, data, onChange }) {
    const value = getPath(data, field.key) ?? field.default ?? '';

    switch (field.type) {
        case 'text':
            return (
                <input
                    className="inspector-input"
                    type="text"
                    value={value}
                    onChange={e => onChange(field.key, e.target.value)}
                />
            );

        case 'textarea':
            return (
                <textarea
                    className="inspector-textarea"
                    rows={field.rows ?? 3}
                    value={value}
                    onChange={e => onChange(field.key, e.target.value)}
                />
            );

        case 'number':
            return (
                <input
                    className="inspector-input"
                    type="number"
                    value={value}
                    onChange={e => onChange(field.key, Number(e.target.value))}
                />
            );

        case 'checkbox':
            return (
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={e => onChange(field.key, e.target.checked)}
                />
            );

        case 'select':
            return (
                <select
                    className="inspector-select"
                    value={value}
                    onChange={e => onChange(field.key, e.target.value)}
                >
                    {(field.options ?? []).map(opt => {
                        const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
                        return <option key={o.value} value={o.value}>{o.label}</option>;
                    })}
                </select>
            );

        case 'string-array': {
            const arr = Array.isArray(value) ? value : [];
            return (
                <div className="inspector-string-array">
                    {arr.map((item, i) => (
                        <div key={i} className="inspector-string-array__row">
                            <input
                                className="inspector-input"
                                type="text"
                                value={item}
                                onChange={e => {
                                    const next = [...arr];
                                    next[i] = e.target.value;
                                    onChange(field.key, next);
                                }}
                            />
                            <button
                                className="inspector-btn inspector-btn--danger"
                                onClick={() => onChange(field.key, arr.filter((_, j) => j !== i))}
                            >✕</button>
                        </div>
                    ))}
                    <button
                        className="inspector-btn"
                        onClick={() => onChange(field.key, [...arr, ''])}
                    >+ Добавить</button>
                </div>
            );
        }

        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// NodeInspector
// ---------------------------------------------------------------------------

export default function NodeInspector() {
    const selectedNodeId = useQuestStore(s => s.selectedNodeId);
    const nodes          = useQuestStore(s => s.nodes);
    const updateNodeData = useQuestStore(s => s.updateNodeData);

    if (!selectedNodeId) {
        return (
            <div className="inspector inspector--empty">
                <p>Выберите ноду для редактирования</p>
            </div>
        );
    }

    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node) return null;

    const def = NodeRegistry[node.type];
    if (!def) return null;

    const { inspector } = def;

    // -----------------------------------------------------------------------
    // Generic field patch
    // -----------------------------------------------------------------------

    function handleFieldChange(path, value) {
        updateNodeData(selectedNodeId, setPath(node.data, path, value));
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="inspector">
            <div className="inspector__header">
                <span
                    className="inspector__color-dot"
                    style={{ background: def.color }}
                />
                <span className="inspector__title">{def.label}</span>
                <span className="inspector__id">{selectedNodeId}</span>
            </div>

            <div className="inspector__body">
                {inspector.widget === 'fields' && inspector.fields.map(field => (
                    <div key={field.key} className="inspector__field">
                        <label className="inspector__label">{field.label}</label>
                        <FieldEditor
                            field={field}
                            data={node.data}
                            onChange={handleFieldChange}
                        />
                    </div>
                ))}

                {inspector.widget === 'dialogue-editor' && (
                    <DialogueEditor
                        nodeId={selectedNodeId}
                        lines={node.data.lines ?? []}
                    />
                )}

                {inspector.widget === 'choice-editor' && (
                    <>
                        {/* Common text field above the choice editor */}
                        <div className="inspector__field">
                            <label className="inspector__label">Текст вопроса</label>
                            <FieldEditor
                                field={{ key: 'text', type: 'textarea', rows: 3 }}
                                data={node.data}
                                onChange={handleFieldChange}
                            />
                        </div>
                        <ChoiceEditor
                            nodeId={selectedNodeId}
                            options={node.data.options ?? []}
                        />
                    </>
                )}

                {inspector.widget === 'action-editor' && (
                    <ActionEditor
                        nodeId={selectedNodeId}
                        data={node.data}
                    />
                )}
            </div>
        </div>
    );
}

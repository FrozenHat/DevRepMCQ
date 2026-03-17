import useQuestStore from '../store/questStore.js';

export default function ChoiceEditor({ nodeId, options = [] }) {
    const updateNodeData = useQuestStore(s => s.updateNodeData);

    function setOptions(nextOptions) {
        updateNodeData(nodeId, { options: nextOptions });
    }

    function addOption() {
        setOptions([...options, { label: '' }]);
    }

    function removeOption(index) {
        setOptions(options.filter((_, i) => i !== index));
    }

    function updateOption(index, value) {
        setOptions(options.map((o, i) => (i === index ? { ...o, label: value } : o)));
    }

    return (
        <div className="choice-editor">
            {options.length === 0 && (
                <p className="ce-empty">Нет вариантов. Нажмите «+ Вариант».</p>
            )}

            {options.map((opt, i) => (
                <div key={i} className="ce-option">
                    <span className="ce-option__badge">#{i + 1}</span>
                    <input
                        className="ce-input"
                        type="text"
                        placeholder={`Вариант ${i + 1}…`}
                        value={opt.label}
                        onChange={e => updateOption(i, e.target.value)}
                    />
                    <button
                        className="ce-btn ce-btn--danger"
                        title="Удалить вариант"
                        onClick={() => removeOption(i)}
                    >
                        ✕
                    </button>
                </div>
            ))}

            <p className="ce-hint">
                Каждый вариант создаёт исходящий handle <code>option_N</code> на ноде.
            </p>

            <button className="ce-btn ce-btn--add" onClick={addOption}>
                + Вариант
            </button>
        </div>
    );
}

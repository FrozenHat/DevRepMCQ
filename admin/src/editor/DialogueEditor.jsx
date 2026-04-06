import { useState, useEffect } from 'react';
import * as charactersApi from '../api/charactersApi.js';
import useQuestStore from '../store/questStore.js';

export default function DialogueEditor({ nodeId, lines = [] }) {
    const updateNodeData = useQuestStore(s => s.updateNodeData);
    const [characters, setCharacters] = useState([]);

    useEffect(() => {
        charactersApi.listCharacters()
            .then(list => setCharacters(list))
            .catch(() => setCharacters([]));
    }, []);

    function setLines(nextLines) {
        updateNodeData(nodeId, { lines: nextLines });
    }

    function addLine() {
        const defaultChar = characters[0]?.id ?? '';
        setLines([...lines, { character_id: defaultChar, text: '' }]);
    }

    function removeLine(index) {
        setLines(lines.filter((_, i) => i !== index));
    }

    function moveUp(index) {
        if (index === 0) return;
        const next = [...lines];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        setLines(next);
    }

    function moveDown(index) {
        if (index === lines.length - 1) return;
        const next = [...lines];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        setLines(next);
    }

    function updateLine(index, patch) {
        setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    }

    return (
        <div className="dialogue-editor">
            {lines.length === 0 && (
                <p className="de-empty">Нет реплик. Нажмите «+ Реплика».</p>
            )}

            {lines.map((line, i) => (
                <div key={i} className="de-line">
                    <div className="de-line__controls">
                        <button
                            className="de-btn de-btn--icon"
                            title="Вверх"
                            onClick={() => moveUp(i)}
                            disabled={i === 0}
                        >▲</button>
                        <button
                            className="de-btn de-btn--icon"
                            title="Вниз"
                            onClick={() => moveDown(i)}
                            disabled={i === lines.length - 1}
                        >▼</button>
                        <button
                            className="de-btn de-btn--icon de-btn--danger"
                            title="Удалить"
                            onClick={() => removeLine(i)}
                        >✕</button>
                    </div>

                    <div className="de-line__body">
                        <select
                            className="de-select"
                            value={line.character_id}
                            onChange={e => updateLine(i, { character_id: e.target.value })}
                        >
                            {characters.length === 0 && (
                                <option value={line.character_id}>{line.character_id || '(нет персонажей)'}</option>
                            )}
                            {characters.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <textarea
                            className="de-textarea"
                            rows={2}
                            placeholder="Текст реплики…"
                            value={line.text}
                            onChange={e => updateLine(i, { text: e.target.value })}
                        />
                    </div>
                </div>
            ))}

            <button className="de-btn de-btn--add" onClick={addLine}>
                + Реплика
            </button>
        </div>
    );
}

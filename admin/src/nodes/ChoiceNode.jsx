import { Handle, Position } from '@xyflow/react';
import BaseNode from './BaseNode.jsx';

/**
 * ChoiceNode
 * Единственная нода с динамическими исходящими handle'ами:
 * по одному handle'у на каждый вариант выбора.
 */
export default function ChoiceNode({ id, data, selected }) {
    const options = data.options ?? [];

    return (
        <BaseNode type="choice" nodeId={id} selected={selected}>
            {data.text && <p className="node-prompt">{data.text}</p>}

            {options.length === 0 ? (
                <p className="node-lines-summary">Нет вариантов</p>
            ) : (
                <ul className="node-options">
                    {options.map((opt, idx) => (
                        <li key={idx} className="node-option">
                            <span>{opt.label || `Вариант ${idx + 1}`}</span>
                            <Handle
                                type="source"
                                id={`option_${idx}`}
                                position={Position.Right}
                                style={{
                                    top: `${(idx + 1) / (options.length + 1) * 100}%`,
                                    right: -5,
                                }}
                                title={`→ option_${idx}`}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </BaseNode>
    );
}

import BaseNode from './BaseNode.jsx';

export default function TaskNode({ id, data, selected }) {
    return (
        <BaseNode type="task" nodeId={id} selected={selected}>
            <p className="node-prompt">
                {data.prompt || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Нет вопроса</span>}
            </p>
            {data.answer && (
                <div className="node-field">
                    <span className="node-field__key">ans:</span>
                    <span className="node-answer">{data.answer.slice(0, 30)}</span>
                </div>
            )}
            {data.hint && (
                <div className="node-field">
                    <span className="node-field__key">hint:</span>
                    <span className="node-field__value">{data.hint.slice(0, 30)}</span>
                </div>
            )}
        </BaseNode>
    );
}

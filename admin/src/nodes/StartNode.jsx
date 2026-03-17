import BaseNode from './BaseNode.jsx';

export default function StartNode({ id, data, selected }) {
    return (
        <BaseNode type="start" nodeId={id} selected={selected}>
            {data.title ? (
                <p className="node-text-preview" style={{ fontWeight: 600 }}>{data.title}</p>
            ) : (
                <p className="node-text-preview" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    (нет названия)
                </p>
            )}
            {data.rewards?.points > 0 && (
                <div className="node-field">
                    <span className="node-field__key">pts:</span>
                    <span className="node-field__value">{data.rewards.points}</span>
                </div>
            )}
        </BaseNode>
    );
}

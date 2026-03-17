import BaseNode from './BaseNode.jsx';

const OUTCOME_CLASS = {
    completed: 'node-badge--outcome-completed',
    abandoned: 'node-badge--outcome-abandoned',
    failed:    'node-badge--outcome-failed',
};

export default function EndNode({ id, data, selected }) {
    const cls = OUTCOME_CLASS[data.outcome] ?? '';
    return (
        <BaseNode type="end" nodeId={id} selected={selected}>
            <span className={`node-badge ${cls}`}>{data.outcome ?? 'end'}</span>
            {data.message && (
                <p className="node-text-preview" style={{ marginTop: 4 }}>{data.message}</p>
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

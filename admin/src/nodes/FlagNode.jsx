import BaseNode from './BaseNode.jsx';

export default function FlagNode({ id, data, selected }) {
    const hasAction = data.element_name && data.action;

    return (
        <BaseNode type="flag" nodeId={id} selected={selected}>
            <div className="node-field">
                {hasAction ? (
                    <span className="node-field__value" style={{ color: 'var(--color-accent)' }}>
                        {data.element_name} → {data.action_label ?? data.action}
                    </span>
                ) : (
                    <span className="node-field__key" style={{ opacity: 0.5 }}>
                        Выберите действие…
                    </span>
                )}
            </div>
        </BaseNode>
    );
}

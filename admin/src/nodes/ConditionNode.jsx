import BaseNode from './BaseNode.jsx';

export default function ConditionNode({ id, data, selected }) {
    const cond = data.condition ?? {};
    return (
        <BaseNode type="condition" nodeId={id} selected={selected}>
            <div className="node-field">
                <span className="node-field__key">if</span>
                <span className="node-field__value">
                    {cond.flag || '(нет ключа)'} === {String(cond.equals ?? true)}
                </span>
            </div>
        </BaseNode>
    );
}

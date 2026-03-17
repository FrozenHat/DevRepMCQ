import BaseNode from './BaseNode.jsx';

export default function FlagNode({ id, data, selected }) {
    return (
        <BaseNode type="flag" nodeId={id} selected={selected}>
            <div className="node-field">
                <span className="node-field__key">{data.flag_key || '(нет ключа)'}</span>
                <span className="node-field__value">= {String(data.flag_value ?? true)}</span>
            </div>
        </BaseNode>
    );
}

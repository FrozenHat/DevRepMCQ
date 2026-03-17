import BaseNode from './BaseNode.jsx';

export default function ItemGrantNode({ id, data, selected }) {
    return (
        <BaseNode type="item_grant" nodeId={id} selected={selected}>
            <div className="node-field">
                <span className="node-field__key">item:</span>
                <span className="node-field__value">{data.item_id || '(нет ID)'}</span>
            </div>
        </BaseNode>
    );
}

import BaseNode from './BaseNode.jsx';

export default function DialogueNode({ id, data, selected }) {
    const lines = data.lines ?? [];
    return (
        <BaseNode type="dialogue" nodeId={id} selected={selected}>
            {lines.length === 0 ? (
                <p className="node-lines-summary">Нет реплик</p>
            ) : (
                <>
                    <p className="node-lines-summary">{lines.length} реплик(а)</p>
                    {lines.slice(0, 2).map((line, i) => (
                        <div key={i} className="node-field">
                            <span className="node-field__key">
                                {line.character_id || '—'}:
                            </span>
                            <span className="node-field__value">
                                {line.text?.slice(0, 40) ?? ''}
                                {(line.text?.length ?? 0) > 40 ? '…' : ''}
                            </span>
                        </div>
                    ))}
                    {lines.length > 2 && (
                        <p className="node-lines-summary">+{lines.length - 2} ещё</p>
                    )}
                </>
            )}
        </BaseNode>
    );
}

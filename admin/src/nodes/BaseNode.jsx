import { Handle, Position } from '@xyflow/react';
import { getNodeDef } from './NodeRegistry.js';

/**
 * BaseNode — общий chrome для всех нод.
 * Рендерит:
 *   - Handle'ы входящих соединений (top)
 *   - Цветной заголовок с типом и ID
 *   - Тело (children)
 *   - Handle'ы исходящих соединений (bottom), если не dynamicSources
 */
export default function BaseNode({ type, nodeId, children, selected }) {
    const def = getNodeDef(type);
    if (!def) return null;

    const sourceCount = def.handles.sources.length;

    return (
        <div
            className={`quest-node quest-node--${type} ${selected ? 'quest-node--selected' : ''}`}
            style={{ '--node-color': def.color }}
        >
            {/* Входящие handle'ы */}
            {def.handles.targets.map(h => (
                <Handle
                    key={h.id}
                    type="target"
                    id={h.id}
                    position={Position.Top}
                />
            ))}

            {/* Заголовок */}
            <div className="quest-node__header">
                <span className="quest-node__type-label">{def.label}</span>
                {nodeId && (
                    <span className="quest-node__id" title={nodeId}>{nodeId}</span>
                )}
            </div>

            {/* Тело */}
            <div className="quest-node__body">{children}</div>

            {/* Статические исходящие handle'ы */}
            {!def.handles.dynamicSources && def.handles.sources.map((h, idx) => (
                <Handle
                    key={h.id}
                    type="source"
                    id={h.id}
                    position={Position.Bottom}
                    style={{
                        left: `${(idx + 1) / (sourceCount + 1) * 100}%`,
                    }}
                    title={h.label}
                />
            ))}
        </div>
    );
}

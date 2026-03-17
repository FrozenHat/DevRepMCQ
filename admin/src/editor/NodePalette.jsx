import NodeRegistry from '../nodes/NodeRegistry.js';

const CATEGORY_LABELS = {
    structural: 'Структурные',
    blocking:   'Блокирующие',
    auto:       'Автоматические',
};

const CATEGORY_ORDER = ['structural', 'blocking', 'auto'];

// Group registry by category
const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = Object.entries(NodeRegistry)
        .filter(([, def]) => def.category === cat)
        .map(([type, def]) => ({ type, ...def }));
    return acc;
}, {});

function PaletteItem({ type, label, color }) {
    function onDragStart(event) {
        event.dataTransfer.setData('application/reactflow-nodetype', type);
        event.dataTransfer.effectAllowed = 'move';
    }

    return (
        <div
            className="palette-item"
            draggable
            onDragStart={onDragStart}
            title={`Перетащите на холст или кликните дважды`}
        >
            <span className="palette-item__dot" style={{ background: color }} />
            <span className="palette-item__label">{label}</span>
        </div>
    );
}

export default function NodePalette() {
    return (
        <div className="node-palette">
            <div className="palette-header">Ноды</div>

            {CATEGORY_ORDER.map(cat => (
                <div key={cat} className="palette-group">
                    <div className="palette-group__title">{CATEGORY_LABELS[cat]}</div>
                    {grouped[cat].map(item => (
                        <PaletteItem key={item.type} {...item} />
                    ))}
                </div>
            ))}

            <div className="palette-hint">
                Перетащите ноду на холст
            </div>
        </div>
    );
}

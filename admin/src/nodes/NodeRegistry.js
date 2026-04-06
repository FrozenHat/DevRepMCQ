/**
 * NodeRegistry.js
 * Центральный реестр всех типов нод.
 *
 * Чтобы добавить новый тип:
 *   1. Создать src/nodes/NewTypeNode.jsx
 *   2. Добавить одну запись в объект ниже
 *   3. Больше ничего менять не нужно
 */

import StartNode     from './StartNode.jsx';
import EndNode       from './EndNode.jsx';
import DialogueNode  from './DialogueNode.jsx';
import TaskNode      from './TaskNode.jsx';
import ChoiceNode    from './ChoiceNode.jsx';
import FlagNode      from './FlagNode.jsx';
import ItemGrantNode from './ItemGrantNode.jsx';
import ConditionNode from './ConditionNode.jsx';

/*
 * Схема записи:
 * {
 *   component:       React-компонент ноды на канвасе
 *   label:           Имя для отображения в палитре и заголовке
 *   color:           Hex-цвет акцентной полосы
 *   category:        'structural' | 'blocking' | 'auto'
 *
 *   handles: {
 *     targets: [{ id, label }]       — входящие handle'ы (обычно один 'target')
 *     sources: [{ id, label }]       — исходящие handle'ы ([] у choice — динамические)
 *     dynamicSources: boolean        — true только у choice
 *   }
 *
 *   defaultData:     Object — копируется при создании новой ноды этого типа
 *
 *   inspector:
 *     { widget: 'fields',          fields: FieldDef[] }
 *     { widget: 'dialogue-editor' }
 *     { widget: 'choice-editor'   }
 *
 *   FieldDef: {
 *     key:     string              — dot-path к полю в data ('rewards.points')
 *     label:   string
 *     type:    'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'string-array'
 *     options?: string[]           — только для type='select'
 *   }
 * }
 */

const NodeRegistry = {

    start: {
        component: StartNode,
        label:     'Start',
        color:     '#22c55e',
        category:  'structural',
        handles: {
            targets:        [],
            sources:        [{ id: 'next', label: 'Next' }],
            dynamicSources: false,
        },
        defaultData: {
            type: 'start',
            title: '',
            description: '',
            completion_conditions: [],
            rewards: { points: 0, items: [] },
            next: null,
        },
        inspector: {
            widget: 'fields',
            fields: [
                { key: 'title',                  label: 'Название квеста',      type: 'text' },
                { key: 'description',            label: 'Описание',             type: 'textarea' },
                { key: 'completion_conditions',  label: 'Условия завершения',   type: 'string-array' },
                { key: 'rewards.points',         label: 'Очки за выполнение',   type: 'number' },
                { key: 'rewards.items',          label: 'Предметы-награды',     type: 'string-array' },
            ],
        },
    },

    end: {
        component: EndNode,
        label:     'End',
        color:     '#ef4444',
        category:  'structural',
        handles: {
            targets:        [{ id: 'target', label: '' }],
            sources:        [],
            dynamicSources: false,
        },
        defaultData: {
            type:    'end',
            outcome: 'completed',
            message: '',
            rewards: { points: 0 },
        },
        inspector: {
            widget: 'fields',
            fields: [
                { key: 'outcome',        label: 'Результат',     type: 'select',
                  options: [
                      { value: 'completed', label: 'Завершён'  },
                      { value: 'abandoned', label: 'Заброшен'  },
                      { value: 'failed',    label: 'Провален'  },
                  ] },
                { key: 'message',        label: 'Финальное сообщение', type: 'textarea' },
                { key: 'rewards.points', label: 'Бонусные очки', type: 'number' },
            ],
        },
    },

    dialogue: {
        component: DialogueNode,
        label:     'Dialogue',
        color:     '#3b82f6',
        category:  'blocking',
        handles: {
            targets:        [{ id: 'target', label: '' }],
            sources:        [{ id: 'next', label: 'Next' }],
            dynamicSources: false,
        },
        defaultData: {
            type:  'dialogue',
            lines: [],
            next:  null,
        },
        inspector: { widget: 'dialogue-editor' },
    },

    task: {
        component: TaskNode,
        label:     'Task',
        color:     '#f59e0b',
        category:  'blocking',
        handles: {
            targets: [{ id: 'target', label: '' }],
            sources: [
                { id: 'next_on_success', label: 'Success' },
                { id: 'next_on_fail',    label: 'Fail'    },
            ],
            dynamicSources: false,
        },
        defaultData: {
            type:            'task',
            prompt:          '',
            answer:          '',
            hint:            '',
            case_sensitive:  false,
            next_on_success: null,
            next_on_fail:    null,
        },
        inspector: {
            widget: 'fields',
            fields: [
                { key: 'prompt',         label: 'Вопрос / задача',   type: 'textarea' },
                { key: 'answer',         label: 'Ожидаемый ответ',   type: 'text' },
                { key: 'hint',           label: 'Подсказка (необяз.)', type: 'text' },
                { key: 'case_sensitive', label: 'Учитывать регистр', type: 'checkbox' },
            ],
        },
    },

    choice: {
        component: ChoiceNode,
        label:     'Choice',
        color:     '#8b5cf6',
        category:  'blocking',
        handles: {
            targets:        [{ id: 'target', label: '' }],
            sources:        [],          // генерируются динамически внутри ChoiceNode
            dynamicSources: true,
        },
        defaultData: {
            type:    'choice',
            text:    '',
            options: [],
        },
        inspector: { widget: 'choice-editor' },
    },

    flag: {
        component: FlagNode,
        label:     'Action',
        color:     '#f97316',
        category:  'auto',
        handles: {
            targets:        [{ id: 'target', label: '' }],
            sources:        [{ id: 'next', label: 'Next' }],
            dynamicSources: false,
        },
        defaultData: {
            type:         'flag',
            element_type: null,
            element_id:   null,
            element_name: null,
            action:       null,
            action_label: null,
            params:       {},
            next:         null,
        },
        inspector: { widget: 'action-editor' },
    },

    item_grant: {
        component: ItemGrantNode,
        label:     'Item Grant',
        color:     '#10b981',
        category:  'auto',
        handles: {
            targets:        [{ id: 'target', label: '' }],
            sources:        [{ id: 'next', label: 'Next' }],
            dynamicSources: false,
        },
        defaultData: {
            type:    'item_grant',
            item_id: '',
            next:    null,
        },
        inspector: {
            widget: 'fields',
            fields: [
                { key: 'item_id', label: 'ID предмета', type: 'text' },
            ],
        },
    },

    condition: {
        component: ConditionNode,
        label:     'Condition',
        color:     '#ec4899',
        category:  'auto',
        handles: {
            targets: [{ id: 'target', label: '' }],
            sources: [
                { id: 'true_node',  label: 'True'  },
                { id: 'false_node', label: 'False' },
            ],
            dynamicSources: false,
        },
        defaultData: {
            type:      'condition',
            condition: { flag: '', equals: true },
            true_node:  null,
            false_node: null,
        },
        inspector: {
            widget: 'fields',
            fields: [
                { key: 'condition.flag',   label: 'Флаг (ключ)',  type: 'text' },
                { key: 'condition.equals', label: 'Проверять на', type: 'checkbox' },
            ],
        },
    },

};

export default NodeRegistry;

// Удобные геттеры
export const getNodeDef       = (type) => NodeRegistry[type] ?? null;
export const getAllNodeTypes   = ()     => Object.keys(NodeRegistry);

// Карта для ReactFlow: { typeName: Component }
export const reactFlowNodeTypes = Object.fromEntries(
    Object.entries(NodeRegistry).map(([type, def]) => [type, def.component])
);

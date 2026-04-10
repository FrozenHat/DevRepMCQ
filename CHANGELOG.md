# Changelog

## [Unreleased] — 2026-04-06

### Добавлено

#### Панель администратора (`admin/`)

**Новые страницы и разделы**

- **Scene Editor** (`pages/SceneEditorPage.jsx`, `styles/scene-editor.css`)
  Канвас-редактор с четырьмя режимами инструментов:
  - **NavMesh** — рисование полигонов зон NavMesh (формат phaser-navmesh)
  - **NPC** — расстановка позиций персонажей на сцене
  - **Item** — расстановка позиций предметов на сцене
  - **Hotspot** — расстановка точек взаимодействия с редактируемыми метками
  - Метаданные сцены: название и описание
  - Экспорт JSON: `{ scene, navMesh, markers }`
  - Автосохранение в `localStorage` (`mcq_dev_scene`)
  - Правый клик удаляет ближайший маркер в радиусе 20 px

- **Персонажи** (`pages/CharactersPage.jsx`)
  CRUD-панель для NPC: имя, роль, описание, спрайт.
  Роли: `npc | merchant | enemy | companion | boss`.

- **Предметы** (`pages/ItemsPage.jsx`)
  CRUD-панель для предметов: имя, тип, описание, иконка.
  Типы: `quest | weapon | consumable | key | misc`.

**Новые API-модули**

- `api/charactersApi.js` — CRUD, localStorage-мок (`mcq_dev_characters`) в DEV-режиме
- `api/itemsApi.js` — CRUD, localStorage-мок (`mcq_dev_items`) в DEV-режиме
- `api/locationsApi.js` — читает текущую сцену из `mcq_dev_scene` и возвращает её как список локаций; в production делает `GET /api/locations`

**Нода Action (бывшая Flag)** (`nodes/FlagNode.jsx`, `editor/ActionEditor.jsx`)

- Нода `flag` переименована в **Action** (цвет `#f97316`)
- Blueprint-стиль: три шага в инспекторе — тип элемента → элемент → действие
- Реестр действий (`ACTION_REGISTRY` внутри `ActionEditor.jsx`):
  - `location` → `teleport_to` («Перейти в локацию»)
  - Расширяемый: новые типы добавляются только в реестр, без изменения компонентов
- Канвас-нода показывает `"Название локации → Перейти в локацию"` после настройки
- Пустое состояние: курсивный плейсхолдер «Выберите действие…»

**Навигация**

- `App.jsx` — добавлены четыре вкладки: **Квесты | Scene Editor | Персонажи | Предметы**
- `styles/editor.css` — классы `.app-nav`, `.app-nav__tab`, `.ae-*` (Action Editor)

---

### Исправлено

- **`NodeInspector.jsx`** — критический баг: `field.path` исправлен на `field.key` (все поля инспектора были сломаны)
- **`NodeInspector.jsx`** — нормализация опций `select`: теперь принимает как строки `'completed'`, так и объекты `{ value, label }`
- **`DialogueEditor.jsx`** — убраны хардкоженные `MOCK_CHARACTERS`; персонажи загружаются из `charactersApi.listCharacters()` через `useEffect`
- **`authStore.js`** — добавлено поле `isLoggedIn`; DEV-режим автоматически логинит без PostgreSQL
- **`questApi.js`** — все CRUD-операции работают через `localStorage` в DEV-режиме (ключ `mcq_dev_quests`)

---

### Изменено

| Файл | Что изменилось |
|---|---|
| `nodes/NodeRegistry.js` | `flag`: новые `defaultData`, `widget: 'action-editor'`; `end`: опции select теперь `{value, label}` |
| `nodes/FlagNode.jsx` | Полная перезапись: отображает summary действия |
| `editor/NodeInspector.jsx` | Полная перезапись: баги, нормализация, виджет `action-editor` |
| `editor/DialogueEditor.jsx` | Полная перезапись: реальные персонажи вместо mock |
| `styles/editor.css` | +170 строк: nav, entity-pages, action-editor (`.ae-*`) |

---

### DEV-режим (без PostgreSQL)

Весь стек работает offline через `localStorage`:

| Ключ | Данные |
|---|---|
| `mcq_dev_quests` | Список квестов |
| `mcq_dev_characters` | Персонажи |
| `mcq_dev_items` | Предметы |
| `mcq_dev_scene` | Сцена (NavMesh + маркеры) |

Запуск: `cd admin && npm run dev` → `http://localhost:5174`

---

## [0.1.0] — 2025-xx-xx

- Начальная структура проекта: `admin/`, `api/`, `game/`
- Базовый визуальный редактор квестов на `@xyflow/react`
- Ноды: Start, End, Dialogue, Task, Choice, Flag, ItemGrant, Condition
- Docker-конфигурация

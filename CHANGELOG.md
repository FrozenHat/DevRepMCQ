# Changelog

## [Unreleased] — 14 апреля 2026

Проделана значительная работа по стабилизации всей системы, исправлению критических ошибок и введению полноценного рабочего цикла «редактируй → сохраняй → видишь в игре».
Параллельно заложены ключевые основы для построения игрового UI: механизм хранения геометрии сцен, расстановки объектов и загрузки фонов сцен по URL из базы данных.

---

### Инфраструктура и локальная разработка

- **PostgreSQL через Docker** — добавлен `docker-compose.yml` с сервисом `postgres`; API и admin запускаются нативно, БД — в контейнере. Добавлены `api/.env` и `admin/.env.local`.
- **Переключатель режимов `VITE_USE_API`** — флаг в `admin/.env.local` переключает панель между localStorage-моком (offline) и реальным API; позволяет разрабатывать без поднятого бэкенда.
- **Vite proxy расширен** — проксирование `/api → localhost:3000` дополнено проксированием `/uploads → localhost:3000` для раздачи загруженных изображений через dev-сервер.
- **Статические файлы в API** — `express.static` подключён для пути `/uploads`; загруженные изображения сцен хранятся в `api/uploads/scenes/` и доступны по прямому URL.

---

### Критические исправления

- **Аутентификация (401 Unauthorized)** — исправлен фиктивный bcrypt-хэш в `002_seed_admin.sql`, который никогда не совпадал ни с каким паролем. Заменён реальным хэшем, сгенерированным через `admin:create`. Это разблокировало вход в панель.
- **Квест-редактор: данные не загружались после сохранения** — в `questService.getQuestVersions` отсутствовал столбец `data` в SELECT. `target.data` всегда был `undefined`, граф при открытии всегда был пустым. Добавлен `data` в запрос.
- **NodeInspector: все поля были пустыми** — `NodeRegistry` описывает поля через `key:`, `NodeInspector` читал `field.path` повсюду. Все инспекторные поля всех типов узлов были сломаны. Исправлено: `field.path` → `field.key` во всём компоненте.
- **Авто-сохранение сцены на каждый ввод** — редактор сцены вызывал `upsertScene` при любом изменении состояния. Удалено; добавлена явная кнопка «Сохранить в БД» со статусом `saving / saved / error`.

---

### API — новые возможности

#### Персонажи и предметы
- Новые таблицы `characters` и `items` (миграция `003_characters_items.sql`).
- `GET / POST / PATCH / DELETE /api/characters` — полный CRUD, только `admin`.
- `GET / POST / PATCH / DELETE /api/items` — полный CRUD, только `admin`.

#### Сцены
- `GET /api/scenes` — список всех сцен (admin); возвращает `id, key, title, data, created_at, updated_at`.
- `PUT /api/scenes/:key` — upsert сцены из редактора (admin).
- `POST /api/scenes/:key/image` — загрузка фона через `multipart/form-data` (multer); файл сохраняется как `{key}_{timestamp}.ext`; возвращает `{ url }`.
- `GET /api/scenes/:key` — чтение конфигурации сцены игровым клиентом (любой авторизованный пользователь).

#### Квесты
- `GET /api/locations` — список сцен в формате `[{ id, name }]` для Action-узла квест-редактора.

---

### Admin Panel — Scene Editor

#### Менеджмент сцен (список / редактирование)
- При `VITE_USE_API=true` панель открывается на странице списка: сетка карточек с названием, ключом, количеством полигонов и маркеров, датой изменения.
- Клик по карточке загружает данные из БД, восстанавливает состояние редактора и отображает фоновое изображение на холсте.
- «+ Новая сцена» сбрасывает редактор в чистое состояние.
- «← Сцены» возвращает в список и обновляет его.

#### Сохранение фонового изображения
- При выборе файла изображение сразу отображается на холсте (локальный blob URL, без запросов).
- При «Сохранить в БД»: изображение сначала загружается на сервер (`POST /api/scenes/:key/image`), полученный URL сохраняется в `data.scene.bgUrl`, затем вся структура сцены сохраняется.
- При повторном открытии сцены из списка фон автоматически загружается с сохранённого URL.

#### Структура данных сцены
```json
{
  "scene": {
    "name": "Городская площадь",
    "description": "...",
    "width": 1920,
    "height": 1080,
    "bgUrl": "/uploads/scenes/town_square_1744123456789.jpg"
  },
  "navMesh": [
    [{ "x": 100, "y": 200 }, { "x": 300, "y": 200 }, { "x": 200, "y": 400 }]
  ],
  "markers": [
    { "id": "mnpc_1", "type": "npc", "x": 512, "y": 300, "targetId": "uuid...", "label": "Стражник" }
  ]
}
```

---

### Admin Panel — Quest Editor

- **Action Node (Blueprint-стиль)** — узел `flag` переработан: инспектор в три шага — тип объекта → конкретный объект → действие. На холсте отображает `element_name → action_label`. Текущий реестр: `location → teleport_to`.
- **Диалоговый узел** — персонажи загружаются из `GET /api/characters` вместо захардкоженного массива.
- **Сохранение и загрузка** — граф сохраняется с debounce 1500 мс; загрузка корректно читает сохранённые данные (исправлен баг с отсутствующей колонкой `data`).

---

### Основы игрового UI

Несмотря на то что игровой рантайм ещё не переключён, заложены все необходимые структуры данных для работы игры на реальном контенте:

| Что готово | Зачем нужно игре |
|---|---|
| NavMesh-полигоны хранятся в БД как массив вершин | Основа для геометрического поиска пути (замена пиксельного A*) |
| Маркеры NPC/Item/Hotspot с координатами и `targetId` | Движок спавнит объекты по данным из API без хардкода позиций |
| `bgUrl` в `data.scene` каждой сцены | Phaser загружает фон по URL — сцены полностью управляются из редактора |
| `GET /api/scenes/:key` доступен игровому клиенту | Единая точка получения конфигурации: геометрия + объекты + фон |
| Action-узел `teleport_to` связывает квест со сценой | Квест управляет переходами между локациями декларативно |

---

### Изменённые файлы

| Файл | Изменение |
|---|---|
| `api/src/routes/scenes.js` | Список сцен, upsert, загрузка изображения (multer), `updated_at` в SELECT |
| `api/src/routes/characters.js` | Новый: CRUD персонажей |
| `api/src/routes/items.js` | Новый: CRUD предметов |
| `api/src/index.js` | Регистрация роутов, `/api/locations`, `express.static` для `/uploads` |
| `api/src/services/questService.js` | Добавлен `data` в SELECT `quest_versions` |
| `api/src/db/migrations/002_seed_admin.sql` | Исправлен bcrypt-хэш администратора |
| `api/src/db/migrations/003_characters_items.sql` | Новый: таблицы `characters` и `items` |
| `api/.env` | Новый: конфигурация локального окружения |
| `admin/src/pages/SceneEditorPage.jsx` | Список/редактирование сцен, загрузка и сохранение фона |
| `admin/src/api/sceneApi.js` | Новый: `listScenes`, `getScene`, `upsertScene`, `uploadSceneImage` |
| `admin/src/api/locationsApi.js` | Новый: `listLocations` для Action-узла |
| `admin/src/api/charactersApi.js` | Новый: `listCharacters`, CRUD |
| `admin/src/api/itemsApi.js` | Новый: `listItems`, CRUD |
| `admin/src/editor/ActionEditor.jsx` | Новый: Blueprint-инспектор для action-узла |
| `admin/src/nodes/FlagNode.jsx` | Переработан в Action Node |
| `admin/src/editor/NodeInspector.jsx` | Исправлен `field.path → field.key`, нормализация options, виджет `action-editor` |
| `admin/src/editor/DialogueEditor.jsx` | Персонажи из API вместо mock |
| `admin/src/nodes/NodeRegistry.js` | Обновлено определение action и end узлов |
| `admin/src/styles/scene-editor.css` | Стили для карточек и сетки списка сцен |
| `admin/vite.config.js` | Proxy для `/api` и `/uploads` |
| `admin/.env.local` | Новый: `VITE_USE_API=true` |
| `docker-compose.yml` | PostgreSQL-сервис для локальной разработки |

---

## [Unreleased] — 6 апреля 2026

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

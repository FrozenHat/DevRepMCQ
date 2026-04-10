/**
 * SceneEditorPage.jsx
 * Full scene authoring tool: NavMesh, NPC/Item placement, Hotspots.
 */
import { useRef, useState, useEffect } from 'react';
import * as charactersApi from '../api/charactersApi.js';
import * as itemsApi      from '../api/itemsApi.js';
import * as sceneApi      from '../api/sceneApi.js';
import '../styles/scene-editor.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const VERTEX_RADIUS = 5;
const CLOSE_RADIUS  = 14;
const POLY_COLORS   = ['#58a6ff', '#3fb950', '#f0883e', '#bc8cff', '#f85149', '#e3b341'];
const MARKER_R      = 14;
const ITEM_HW       = 11;
const SAVE_KEY      = 'mcq_dev_scene';

const TOOL_LABELS = { navmesh: 'NavMesh', npc: 'NPC', item: 'Предмет', hotspot: 'Хотспот' };

// ─── Canvas marker drawers ────────────────────────────────────────────────────

function drawLabel(ctx, x, baseY, text) {
    if (!text) return;
    ctx.font = '10px sans-serif';
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, baseY + 2, w, 15, 3);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, baseY + 10);
}

function drawMarkerNpc(ctx, x, y, label, ghost) {
    ctx.globalAlpha = ghost ? 0.45 : 1;
    ctx.beginPath();
    ctx.arc(x, y, MARKER_R, 0, Math.PI * 2);
    ctx.fillStyle = '#f0883e33'; ctx.fill();
    ctx.strokeStyle = '#f0883e'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke();
    ctx.fillStyle = '#f0883e'; ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', x, y);
    drawLabel(ctx, x, y + MARKER_R, label);
    ctx.globalAlpha = 1;
}

function drawMarkerItem(ctx, x, y, label, ghost) {
    ctx.globalAlpha = ghost ? 0.45 : 1;
    ctx.beginPath();
    ctx.roundRect(x - ITEM_HW, y - ITEM_HW, ITEM_HW * 2, ITEM_HW * 2, 3);
    ctx.fillStyle = '#3fb95033'; ctx.fill();
    ctx.strokeStyle = '#3fb950'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke();
    ctx.fillStyle = '#3fb950'; ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('I', x, y);
    drawLabel(ctx, x, y + ITEM_HW, label);
    ctx.globalAlpha = 1;
}

function drawMarkerHotspot(ctx, x, y, label, ghost) {
    ctx.globalAlpha = ghost ? 0.45 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y - MARKER_R); ctx.lineTo(x + MARKER_R, y);
    ctx.lineTo(x, y + MARKER_R); ctx.lineTo(x - MARKER_R, y); ctx.closePath();
    ctx.fillStyle = '#bc8cff33'; ctx.fill();
    ctx.strokeStyle = '#bc8cff'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke();
    ctx.fillStyle = '#bc8cff'; ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', x, y);
    drawLabel(ctx, x, y + MARKER_R, label);
    ctx.globalAlpha = 1;
}

// ─── Main canvas render ──────────────────────────────────────────────────────

function renderCanvas(canvas, bgImg, polygons, current, mouse, markers, tool, charMap, itemMap) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#1a1f2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#30363d'; ctx.font = '15px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Загрузите изображение сцены', canvas.width / 2, canvas.height / 2);
    }

    // Completed polygons
    polygons.forEach((poly, i) => {
        const color = POLY_COLORS[i % POLY_COLORS.length];
        ctx.beginPath();
        poly.forEach((p, j) => j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = color + '2e'; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke();
        poly.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, VERTEX_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
        });
        const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
        const cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.roundRect(cx - 14, cy - 10, 28, 20, 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`#${i + 1}`, cx, cy);
    });

    // Current polygon in progress
    if (current.length > 0) {
        ctx.beginPath();
        current.forEach((p, j) => j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        if (mouse) ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
        current.forEach((p, j) => {
            if (j === 0 && current.length >= 3) {
                ctx.beginPath(); ctx.arc(p.x, p.y, CLOSE_RADIUS, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
            }
            ctx.beginPath(); ctx.arc(p.x, p.y, VERTEX_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = j === 0 ? '#ffffff' : 'rgba(255,255,255,0.7)'; ctx.fill();
        });
    }

    // Placed markers
    markers.forEach(m => {
        const label = m.label || charMap[m.targetId]?.name || itemMap[m.targetId]?.name || '';
        if (m.type === 'npc')     drawMarkerNpc(ctx, m.x, m.y, label, false);
        if (m.type === 'item')    drawMarkerItem(ctx, m.x, m.y, label, false);
        if (m.type === 'hotspot') drawMarkerHotspot(ctx, m.x, m.y, label, false);
    });

    // Ghost preview
    if (mouse && tool !== 'navmesh') {
        if (tool === 'npc')     drawMarkerNpc(ctx, mouse.x, mouse.y, '', true);
        if (tool === 'item')    drawMarkerItem(ctx, mouse.x, mouse.y, '', true);
        if (tool === 'hotspot') drawMarkerHotspot(ctx, mouse.x, mouse.y, '', true);
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SceneEditorPage() {
    const canvasRef    = useRef(null);
    const bgImgRef     = useRef(null);
    const fileInputRef = useRef(null);

    const [sceneName,      setSceneName]      = useState('');
    const [sceneDesc,      setSceneDesc]      = useState('');
    const [bgLoaded,       setBgLoaded]       = useState(false);
    const [canvasSize,     setCanvasSize]     = useState({ w: 900, h: 550 });
    const [polygons,       setPolygons]       = useState([]);
    const [current,        setCurrent]        = useState([]);
    const [mouse,          setMouse]          = useState(null);
    const [markers,        setMarkers]        = useState([]);
    const [tool,           setTool]           = useState('navmesh');
    const [characters,     setCharacters]     = useState([]);
    const [items,          setItems]          = useState([]);
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [copied,         setCopied]         = useState(false);

    const charMap = Object.fromEntries(characters.map(c => [c.id, c]));
    const itemMap = Object.fromEntries(items.map(i => [i.id, i]));

    // Load
    useEffect(() => {
        charactersApi.listCharacters().then(setCharacters).catch(() => {});
        itemsApi.listItems().then(setItems).catch(() => {});
        try {
            const d = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
            if (d) {
                if (d.sceneName)  setSceneName(d.sceneName);
                if (d.sceneDesc)  setSceneDesc(d.sceneDesc);
                if (d.canvasSize) setCanvasSize(d.canvasSize);
                if (d.polygons)   setPolygons(d.polygons);
                if (d.markers)    setMarkers(d.markers);
            }
        } catch (_) {}
    }, []);

    // Auto-save
    useEffect(() => {
        if (!polygons.length && !markers.length && !sceneName) return;
        localStorage.setItem(SAVE_KEY, JSON.stringify({ sceneName, sceneDesc, canvasSize, polygons, markers }));

        // Also persist to DB when connected to real API
        if (import.meta.env.VITE_USE_API && sceneName) {
            const key = sceneName.toLowerCase().replace(/\s+/g, '_');
            const exportData = {
                scene:   { name: sceneName, description: sceneDesc, width: canvasSize.w, height: canvasSize.h },
                navMesh: polygons.map(poly => poly.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))),
                markers: markers.map(m => ({ id: m.id, type: m.type, x: m.x, y: m.y, targetId: m.targetId ?? null, label: m.label })),
            };
            sceneApi.upsertScene(key, sceneName, exportData).catch(console.error);
        }
    }, [sceneName, sceneDesc, canvasSize, polygons, markers]);

    // Redraw
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        renderCanvas(canvas, bgImgRef.current, polygons, current, mouse, markers, tool, charMap, itemMap);
    }, [bgLoaded, canvasSize, polygons, current, mouse, markers, tool, characters, items]);

    // ── Helpers ──────────────────────────────────────────────────────────────

    function toCanvasPos(e) {
        const canvas = canvasRef.current;
        const rect   = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width  / rect.width),
            y: (e.clientY - rect.top)  * (canvas.height / rect.height),
        };
    }

    function nearFirst(pos, pts) {
        if (pts.length < 3) return false;
        const dx = pos.x - pts[0].x, dy = pos.y - pts[0].y;
        return Math.sqrt(dx * dx + dy * dy) <= CLOSE_RADIUS;
    }

    function nearestMarker(pos) {
        let best = null, bestD = Infinity;
        markers.forEach(m => {
            const d = Math.hypot(m.x - pos.x, m.y - pos.y);
            if (d < 20 && d < bestD) { best = m; bestD = d; }
        });
        return best;
    }

    // ── Events ───────────────────────────────────────────────────────────────

    function onCanvasClick(e) {
        const pos = toCanvasPos(e);
        if (tool === 'navmesh') {
            setCurrent(prev => {
                if (nearFirst(pos, prev)) { setPolygons(p => [...p, prev]); return []; }
                return [...prev, pos];
            });
        } else if (tool === 'hotspot') {
            setMarkers(prev => [...prev, { id: `hs_${Date.now()}`, type: 'hotspot', x: Math.round(pos.x), y: Math.round(pos.y), label: 'Хотспот' }]);
        } else if (tool === 'npc' && selectedTarget) {
            setMarkers(prev => [...prev, { id: `mnpc_${Date.now()}`, type: 'npc', x: Math.round(pos.x), y: Math.round(pos.y), targetId: selectedTarget, label: charMap[selectedTarget]?.name ?? 'NPC' }]);
        } else if (tool === 'item' && selectedTarget) {
            setMarkers(prev => [...prev, { id: `mitem_${Date.now()}`, type: 'item', x: Math.round(pos.x), y: Math.round(pos.y), targetId: selectedTarget, label: itemMap[selectedTarget]?.name ?? 'Предмет' }]);
        }
    }

    function onContextMenu(e) {
        e.preventDefault();
        const pos = toCanvasPos(e);
        if (tool === 'navmesh') { setCurrent([]); return; }
        const m = nearestMarker(pos);
        if (m) setMarkers(prev => prev.filter(x => x.id !== m.id));
    }

    function onMouseMove(e) { setMouse(toCanvasPos(e)); }
    function onMouseLeave()  { setMouse(null); }

    function onImageChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => { bgImgRef.current = img; setCanvasSize({ w: img.naturalWidth, h: img.naturalHeight }); setBgLoaded(v => !v); };
        img.src = URL.createObjectURL(file);
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    function deleteMarker(id)             { setMarkers(prev => prev.filter(m => m.id !== id)); }
    function updateMarkerLabel(id, label) { setMarkers(prev => prev.map(m => m.id === id ? { ...m, label } : m)); }
    function deletePolygon(idx)           { setPolygons(prev => prev.filter((_, i) => i !== idx)); }
    function clearAll()                   { setPolygons([]); setCurrent([]); setMarkers([]); }

    function buildExport() {
        return {
            scene:   { name: sceneName, description: sceneDesc, width: canvasSize.w, height: canvasSize.h },
            navMesh: polygons.map(poly => poly.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))),
            markers: markers.map(m => ({ id: m.id, type: m.type, x: m.x, y: m.y, targetId: m.targetId ?? null, label: m.label })),
        };
    }

    function exportJson() {
        const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = `${sceneName || 'scene'}.json`; a.click();
    }

    async function copyJson() {
        await navigator.clipboard.writeText(JSON.stringify(buildExport(), null, 2));
        setCopied(true); setTimeout(() => setCopied(false), 1800);
    }

    const hasContent = polygons.length > 0 || markers.length > 0;

    const HINTS = {
        navmesh: 'ЛКМ — точка · Клик на первую точку — замкнуть · ПКМ — отменить',
        npc:     selectedTarget ? 'ЛКМ — разместить NPC · ПКМ — удалить ближайший' : 'Выберите персонажа в сайдбаре',
        item:    selectedTarget ? 'ЛКМ — разместить предмет · ПКМ — удалить ближайший' : 'Выберите предмет в сайдбаре',
        hotspot: 'ЛКМ — поставить хотспот · ПКМ — удалить · Название редактируется в сайдбаре',
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="se-page">
            {/* Toolbar */}
            <div className="se-toolbar">
                <span className="se-toolbar__title">Scene Editor</span>
                <div className="se-toolbar__actions">
                    <button className="se-btn se-btn--secondary" onClick={() => fileInputRef.current.click()}>Загрузить фон</button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageChange} />
                    {hasContent && <>
                        <button className="se-btn se-btn--ghost" onClick={clearAll}>Очистить всё</button>
                        <button className="se-btn se-btn--ghost" onClick={copyJson}>{copied ? '✓ Скопировано' : 'Копировать JSON'}</button>
                        <button className="se-btn se-btn--primary" onClick={exportJson}>Скачать JSON</button>
                    </>}
                </div>
            </div>

            {/* Tool switcher */}
            <div className="se-tools">
                {Object.entries(TOOL_LABELS).map(([key, label]) => (
                    <button
                        key={key}
                        className={`se-tool-btn${tool === key ? ' se-tool-btn--active' : ''}`}
                        onClick={() => { setTool(key); setSelectedTarget(null); setCurrent([]); }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Layout */}
            <div className="se-layout">
                <div className="se-canvas-wrap">
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.w}
                        height={canvasSize.h}
                        className="se-canvas"
                        onClick={onCanvasClick}
                        onMouseMove={onMouseMove}
                        onMouseLeave={onMouseLeave}
                        onContextMenu={onContextMenu}
                    />
                    <div className="se-hint">{HINTS[tool]}</div>
                </div>

                <div className="se-sidebar">
                    {/* Scene metadata */}
                    <div className="se-meta">
                        <label className="se-meta__label">Название</label>
                        <input className="se-meta__input" placeholder="Городская площадь" value={sceneName} onChange={e => setSceneName(e.target.value)} />
                        <label className="se-meta__label">Описание</label>
                        <textarea className="se-meta__textarea" placeholder="Описание локации…" rows={2} value={sceneDesc} onChange={e => setSceneDesc(e.target.value)} />
                    </div>

                    {/* NavMesh */}
                    {tool === 'navmesh' && <>
                        <div className="se-sidebar__title">Полигоны <span className="se-badge">{polygons.length}</span></div>
                        {current.length > 0 && <div className="se-drawing-hint">Рисуется… {current.length} точек</div>}
                        {polygons.length === 0 && current.length === 0 && <p className="se-empty">Нарисуйте первый полигон</p>}
                        <div className="se-poly-list">
                            {polygons.map((poly, i) => (
                                <div key={i} className="se-poly-item">
                                    <span className="se-poly-dot" style={{ background: POLY_COLORS[i % POLY_COLORS.length] }} />
                                    <span className="se-poly-name">Полигон #{i + 1}</span>
                                    <span className="se-poly-count">{poly.length} вершин</span>
                                    <button className="se-poly-del" onClick={() => deletePolygon(i)}>✕</button>
                                </div>
                            ))}
                        </div>
                    </>}

                    {/* NPC */}
                    {tool === 'npc' && <>
                        <div className="se-sidebar__title">Выберите персонажа</div>
                        {characters.length === 0
                            ? <p className="se-empty">Нет персонажей — создайте в разделе «Персонажи»</p>
                            : <div className="se-picker">
                                {characters.map(c => (
                                    <div key={c.id} className={`se-picker-item${selectedTarget === c.id ? ' se-picker-item--selected' : ''}`} onClick={() => setSelectedTarget(c.id === selectedTarget ? null : c.id)}>
                                        <span className="se-picker-icon">👤</span>
                                        <span className="se-picker-name">{c.name}</span>
                                        <span className="se-picker-meta">{c.role}</span>
                                    </div>
                                ))}
                            </div>
                        }
                        {markers.filter(m => m.type === 'npc').length > 0 && <>
                            <div className="se-sidebar__title" style={{ marginTop: 8 }}>Размещено <span className="se-badge">{markers.filter(m => m.type === 'npc').length}</span></div>
                            {markers.filter(m => m.type === 'npc').map(m => (
                                <div key={m.id} className="se-marker-item se-marker-item--npc">
                                    <span className="se-marker-dot" style={{ background: '#f0883e' }}>N</span>
                                    <span className="se-marker-label">{m.label}</span>
                                    <span className="se-marker-pos">{m.x},{m.y}</span>
                                    <button className="se-poly-del" onClick={() => deleteMarker(m.id)}>✕</button>
                                </div>
                            ))}
                        </>}
                    </>}

                    {/* Item */}
                    {tool === 'item' && <>
                        <div className="se-sidebar__title">Выберите предмет</div>
                        {items.length === 0
                            ? <p className="se-empty">Нет предметов — создайте в разделе «Предметы»</p>
                            : <div className="se-picker">
                                {items.map(it => (
                                    <div key={it.id} className={`se-picker-item${selectedTarget === it.id ? ' se-picker-item--selected' : ''}`} onClick={() => setSelectedTarget(it.id === selectedTarget ? null : it.id)}>
                                        <span className="se-picker-icon">◆</span>
                                        <span className="se-picker-name">{it.name}</span>
                                        <span className="se-picker-meta">{it.type}</span>
                                    </div>
                                ))}
                            </div>
                        }
                        {markers.filter(m => m.type === 'item').length > 0 && <>
                            <div className="se-sidebar__title" style={{ marginTop: 8 }}>Размещено <span className="se-badge">{markers.filter(m => m.type === 'item').length}</span></div>
                            {markers.filter(m => m.type === 'item').map(m => (
                                <div key={m.id} className="se-marker-item se-marker-item--item">
                                    <span className="se-marker-dot" style={{ background: '#3fb950' }}>I</span>
                                    <span className="se-marker-label">{m.label}</span>
                                    <span className="se-marker-pos">{m.x},{m.y}</span>
                                    <button className="se-poly-del" onClick={() => deleteMarker(m.id)}>✕</button>
                                </div>
                            ))}
                        </>}
                    </>}

                    {/* Hotspot */}
                    {tool === 'hotspot' && <>
                        <div className="se-sidebar__title">Хотспоты <span className="se-badge">{markers.filter(m => m.type === 'hotspot').length}</span></div>
                        {markers.filter(m => m.type === 'hotspot').length === 0
                            ? <p className="se-empty">Кликните на сцену чтобы поставить хотспот</p>
                            : markers.filter(m => m.type === 'hotspot').map(m => (
                                <div key={m.id} className="se-marker-item se-marker-item--hotspot">
                                    <span className="se-marker-dot" style={{ background: '#bc8cff' }}>H</span>
                                    <div className="se-marker-edit">
                                        <input className="se-marker-label-input" value={m.label} onChange={e => updateMarkerLabel(m.id, e.target.value)} />
                                        <span className="se-marker-pos">{m.x},{m.y}</span>
                                    </div>
                                    <button className="se-poly-del" onClick={() => deleteMarker(m.id)}>✕</button>
                                </div>
                            ))
                        }
                    </>}
                </div>
            </div>
        </div>
    );
}

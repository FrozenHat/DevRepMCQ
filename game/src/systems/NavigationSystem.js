/**
 * NavigationSystem
 *
 * Builds a walkable boolean grid from NavMesh polygon data (JSON),
 * then uses A* to find paths and a line-of-sight string-pull to smooth them.
 *
 * The navmesh data format matches the export from the admin Scene Editor:
 * {
 *   scene:   { width: number, height: number },
 *   navMesh: Array<Array<{ x: number, y: number }>>  // convex or concave polygons
 * }
 *
 * Replaces the old PNG-alpha-channel approach.
 */
export default class NavigationSystem {
    /**
     * @param {Phaser.Scene}  scene
     * @param {Player}        player
     * @param {Object|null}   navmeshData  Parsed JSON from hub_navmesh.json
     */
    constructor(scene, player, navmeshData = null) {
        this.scene  = scene;
        this.player = player;

        // World bounds come from navmesh scene metadata (or background image as fallback)
        this.worldWidth  = navmeshData?.scene?.width  ?? this._bgWidth();
        this.worldHeight = navmeshData?.scene?.height ?? this._bgHeight();
        this.polygons    = navmeshData?.navMesh ?? [];

        this.gridSize   = 32;
        this.navGrid    = null;
        this.gridWidth  = 0;
        this.gridHeight = 0;

        this.targetMarker = null;
        this.agentPadding = this.getAgentPadding();

        if (this.polygons.length > 0) {
            this._buildGrid();
        } else {
            console.warn('NavigationSystem: No navmesh polygons — all areas walkable.');
        }
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    _bgWidth() {
        try { return this.scene.textures.get('hub_background')?.getSourceImage()?.width ?? 1920; }
        catch { return 1920; }
    }

    _bgHeight() {
        try { return this.scene.textures.get('hub_background')?.getSourceImage()?.height ?? 1080; }
        catch { return 1080; }
    }

    getAgentPadding() {
        const body  = this.player?.sprite?.body;
        const halfW = body?.halfWidth  ?? 16;
        const halfH = body?.halfHeight ?? 16;
        return Math.max(Math.min(Math.max(halfW, halfH), 22), 12);
    }

    // -----------------------------------------------------------------------
    // Grid construction — rasterise polygons via ray-casting
    // -----------------------------------------------------------------------

    _buildGrid() {
        this.gridWidth  = Math.ceil(this.worldWidth  / this.gridSize);
        this.gridHeight = Math.ceil(this.worldHeight / this.gridSize);

        this.navGrid = [];
        for (let gy = 0; gy < this.gridHeight; gy++) {
            this.navGrid[gy] = [];
            for (let gx = 0; gx < this.gridWidth; gx++) {
                const wx = gx * this.gridSize + this.gridSize / 2;
                const wy = gy * this.gridSize + this.gridSize / 2;
                this.navGrid[gy][gx] = this._pointInAnyPolygon(wx, wy);
            }
        }
        console.log(`NavigationSystem: grid ${this.gridWidth}×${this.gridHeight} from ${this.polygons.length} polygon(s)`);
    }

    /** Ray-casting point-in-polygon test. */
    _pointInPolygon(x, y, poly) {
        let inside = false;
        const n = poly.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            const cross = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (cross) inside = !inside;
        }
        return inside;
    }

    _pointInAnyPolygon(x, y) {
        for (const poly of this.polygons) {
            if (this._pointInPolygon(x, y, poly)) return true;
        }
        return false;
    }

    // -----------------------------------------------------------------------
    // Public API — same contract as before
    // -----------------------------------------------------------------------

    getNavBounds() {
        return { width: this.worldWidth, height: this.worldHeight };
    }

    clampToNavBounds(x, y, padding = null) {
        const pad  = padding ?? this.agentPadding;
        const minX = pad;
        const minY = pad;
        const maxX = this.worldWidth  - 1 - pad;
        const maxY = this.worldHeight - 1 - pad;
        return {
            x: Math.max(minX, Math.min(maxX, Math.floor(x))),
            y: Math.max(minY, Math.min(maxY, Math.floor(y))),
        };
    }

    isWalkable(x, y) {
        if (!this.navGrid) {
            // No grid built — fall back to direct point-in-polygon check
            return this.polygons.length > 0
                ? this._pointInAnyPolygon(x, y)
                : true;
        }
        const gx = Math.floor(x / this.gridSize);
        const gy = Math.floor(y / this.gridSize);
        return this.isGridWalkable(gx, gy);
    }

    moveTo(x, y) {
        const clamped = this.clampToNavBounds(x, y);
        let target = clamped;

        if (!this.isWalkable(target.x, target.y)) {
            const nearest = this.findNearestWalkablePoint(target.x, target.y, 500, 6);
            if (!nearest) {
                this.showInvalidMarker(clamped.x, clamped.y);
                return;
            }
            target = this.clampToNavBounds(nearest.x, nearest.y);
        }

        const playerPos = this.player.getPosition();
        const start = this.isWalkable(playerPos.x, playerPos.y)
            ? this.clampToNavBounds(playerPos.x, playerPos.y)
            : (this.findNearestWalkablePoint(playerPos.x, playerPos.y, 500, 6) || playerPos);

        const path = this.calculatePath(start.x, start.y, target.x, target.y);
        if (path && path.length > 0) {
            this.player.setPath(path);
            this.showTargetMarker(target.x, target.y);
        } else {
            this.showInvalidMarker(target.x, target.y);
        }
    }

    calculatePath(startX, startY, endX, endY) {
        if (!this.navGrid) {
            return [
                this.clampToNavBounds(startX, startY),
                this.clampToNavBounds(endX, endY),
            ];
        }

        const s = this.clampToNavBounds(startX, startY);
        const e = this.clampToNavBounds(endX, endY);

        const startGridX = Math.floor(s.x / this.gridSize);
        const startGridY = Math.floor(s.y / this.gridSize);
        const endGridX   = Math.floor(e.x / this.gridSize);
        const endGridY   = Math.floor(e.y / this.gridSize);

        if (!this.isGridWalkable(startGridX, startGridY) || !this.isGridWalkable(endGridX, endGridY)) {
            return null;
        }

        const gridPath = this.findPathAStar(startGridX, startGridY, endGridX, endGridY);
        if (!gridPath) return null;

        const worldPath = gridPath.map(node => {
            const p = {
                x: node.x * this.gridSize + this.gridSize / 2,
                y: node.y * this.gridSize + this.gridSize / 2,
            };
            return this.clampToNavBounds(p.x, p.y);
        });

        return this.smoothPath(worldPath);
    }

    enforcePlayerOnNavmesh() {
        const p       = this.player.getPosition();
        const clamped = this.clampToNavBounds(p.x, p.y);

        const outOfBounds = Math.abs(p.x - clamped.x) > 1 || Math.abs(p.y - clamped.y) > 1;
        const onBadTile   = !this.isWalkable(clamped.x, clamped.y);

        if (outOfBounds || onBadTile) {
            const safe = this.findNearestWalkablePoint(clamped.x, clamped.y, 500, 8);
            if (safe) {
                console.warn(`Player stuck at (${p.x}, ${p.y}), teleporting to (${safe.x}, ${safe.y})`);
                this.player.sprite.setPosition(safe.x, safe.y);
                if (this.player.sprite.body) this.player.sprite.body.setVelocity(0, 0);
                this.player.stopMovement();
            }
        }
    }

    // -----------------------------------------------------------------------
    // A* pathfinding (unchanged)
    // -----------------------------------------------------------------------

    findPathAStar(startX, startY, endX, endY) {
        const startNode = { x: startX, y: startY, g: 0, h: 0, f: 0, parent: null };
        const endNode   = { x: endX, y: endY };

        const openList   = [startNode];
        const closedList = [];

        while (openList.length > 0) {
            let currentIndex = 0;
            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < openList[currentIndex].f) currentIndex = i;
            }

            const current = openList[currentIndex];

            if (current.x === endNode.x && current.y === endNode.y) {
                return this._reconstructPath(current);
            }

            openList.splice(currentIndex, 1);
            closedList.push(current);

            for (const neighbor of this.getGridNeighbors(current)) {
                if (closedList.find(n => n.x === neighbor.x && n.y === neighbor.y)) continue;

                const g = current.g + this._gridDistance(current, neighbor);
                const h = this._heuristic(neighbor, endNode);
                const f = g + h;

                const existing = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);
                if (existing) {
                    if (g < existing.g) { existing.g = g; existing.f = f; existing.parent = current; }
                } else {
                    openList.push({ x: neighbor.x, y: neighbor.y, g, h, f, parent: current });
                }
            }
        }
        return null;
    }

    getGridNeighbors(node) {
        const neighbors = [];
        const dirs = [
            { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
            { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 },
        ];
        for (const dir of dirs) {
            const nx = node.x + dir.x;
            const ny = node.y + dir.y;
            if (!this.isGridWalkable(nx, ny)) continue;

            if (dir.x !== 0 && dir.y !== 0) {
                if (!this.isGridWalkable(node.x + dir.x, node.y)) continue;
                if (!this.isGridWalkable(node.x, node.y + dir.y)) continue;
            }
            neighbors.push({ x: nx, y: ny });
        }
        return neighbors;
    }

    isGridWalkable(x, y) {
        if (x < 0 || y < 0 || x >= this.gridWidth || y >= this.gridHeight) return false;
        return this.navGrid[y][x];
    }

    _gridDistance(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return 1 * (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
    }

    _heuristic(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return 1 * (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
    }

    _reconstructPath(node) {
        const path = [];
        let cur = node;
        while (cur) { path.unshift({ x: cur.x, y: cur.y }); cur = cur.parent; }
        return path;
    }

    // -----------------------------------------------------------------------
    // Path smoothing (unchanged)
    // -----------------------------------------------------------------------

    smoothPath(path) {
        if (!path || path.length <= 2) return path;

        const smoothed = [path[0]];
        let current = 0;

        while (current < path.length - 1) {
            let farthest = current + 1;
            for (let i = current + 2; i < path.length; i++) {
                if (this.hasLineOfSight(path[current], path[i])) farthest = i;
                else break;
            }
            smoothed.push(path[farthest]);
            current = farthest;
        }
        return smoothed;
    }

    hasLineOfSight(from, to) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        const steps = Math.max(dx, dy) / this.gridSize;
        if (steps === 0) return true;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.floor(from.x + (to.x - from.x) * t);
            const y = Math.floor(from.y + (to.y - from.y) * t);
            if (!this.isWalkable(x, y)) return false;
        }
        return true;
    }

    // -----------------------------------------------------------------------
    // Nearest walkable search (unchanged)
    // -----------------------------------------------------------------------

    findNearestWalkablePoint(x, y, maxRadius = 300, step = 8) {
        if (this.isWalkable(x, y)) return { x, y };

        for (let r = step; r <= maxRadius; r += step) {
            for (let angle = 0; angle < 360; angle += 15) {
                const rad = (angle * Math.PI) / 180;
                const px  = Math.floor(x + Math.cos(rad) * r);
                const py  = Math.floor(y + Math.sin(rad) * r);
                if (this.isWalkable(px, py)) return { x: px, y: py };
            }
        }
        return null;
    }

    // -----------------------------------------------------------------------
    // Visual markers (unchanged)
    // -----------------------------------------------------------------------

    showInvalidMarker(x, y) {
        const marker = this.scene.add.graphics();
        marker.lineStyle(3, 0xff0000, 0.8);
        marker.beginPath();
        marker.moveTo(x - 10, y - 10); marker.lineTo(x + 10, y + 10);
        marker.moveTo(x + 10, y - 10); marker.lineTo(x - 10, y + 10);
        marker.strokePath();
        this.scene.tweens.add({ targets: marker, alpha: 0, duration: 500,
            onComplete: () => marker.destroy() });
    }

    showTargetMarker(x, y) {
        if (this.targetMarker) this.targetMarker.destroy();
        this.targetMarker = this.scene.add.circle(x, y, 8, 0xffff00, 0.6);
        this.scene.tweens.add({
            targets: this.targetMarker, alpha: 0, duration: 500,
            onComplete: () => { this.targetMarker?.destroy(); this.targetMarker = null; },
        });
    }

    destroy() {
        if (this.targetMarker) this.targetMarker.destroy();
    }
}

import Phaser from 'phaser';
import Player from '../entities/Player.js';
import NavigationSystem from '../systems/NavigationSystem.js';
import DialogSystem from '../systems/DialogSystem.js';
import QuestEngine from '../systems/QuestEngine.js';
import ApiClient from '../api/ApiClient.js';

/**
 * LocationScene
 *
 * Universal point-and-click location scene.
 *
 * Accepts a sceneConfig object via scene.start('LocationScene', { sceneConfig }).
 * The config shape is defined in src/data/scenes/*.json and mirrors the
 * API contract described in the system README (GET /api/scenes/:key).
 *
 * Responsibilities:
 *   - Load scene-specific assets (background, navmap, occluder) from config.
 *   - Spawn player at the configured spawn point.
 *   - Apply perspective scaling and y-depth sorting.
 *   - Register interactive zones from config.
 *   - Manage quest execution via QuestEngine + DialogSystem when a zone
 *     is triggered.
 *   - Enforce navmesh bounds each frame.
 *   - Handle viewport resize.
 *
 * To add a new location:
 *   1. Create src/data/scenes/<key>.json.
 *   2. Call this.scene.start('LocationScene', { sceneConfig }) with the config.
 *   3. No code changes required in this file.
 */

const apiClient = new ApiClient(null); // null = local fallback only (no auth)

export default class LocationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LocationScene' });
    }

    // -------------------------------------------------------------------------
    // Phaser lifecycle
    // -------------------------------------------------------------------------

    init(data) {
        this.sceneConfig = data?.sceneConfig ?? null;

        // Runtime state
        this.player = null;
        this.navigationSystem = null;
        this.backgroundImage = null;
        this.occluder = null;
        this.perspective = null;
        this.dialogSystem = null;
        this.activeQuest = null;      // current QuestEngine instance
        this.questRunning = false;    // true while a quest dialog is open
    }

    preload() {
        if (!this.sceneConfig) {
            console.error('LocationScene.preload: no sceneConfig provided');
            return;
        }

        const { assets } = this.sceneConfig;

        // Load scene-specific assets only if not already in texture cache.
        // The player spritesheet is a global asset loaded by PreloadScene.
        if (assets.background && !this.textures.exists(assets.background.key)) {
            this.load.image(assets.background.key, assets.background.path);
        }
        if (assets.navmap && !this.textures.exists(assets.navmap.key)) {
            this.load.image(assets.navmap.key, assets.navmap.path);
        }
        if (assets.occluder && !this.textures.exists(assets.occluder.key)) {
            this.load.image(assets.occluder.key, assets.occluder.path);
        }
    }

    create() {
        if (!this.sceneConfig) {
            console.error('LocationScene.create: no sceneConfig provided');
            return;
        }

        const cfg = this.sceneConfig;

        // ------------------------------------------------------------------
        // Background
        // ------------------------------------------------------------------
        this.backgroundImage = this.add.image(0, 0, cfg.assets.background.key).setOrigin(0, 0);
        const bgW = this.backgroundImage.width;
        const bgH = this.backgroundImage.height;

        // ------------------------------------------------------------------
        // Physics world bounds + camera
        // ------------------------------------------------------------------
        this.physics.world.setBounds(0, 0, bgW, bgH);
        this._setupCamera(bgW, bgH);

        // ------------------------------------------------------------------
        // Player (spritesheet must be loaded by PreloadScene)
        // ------------------------------------------------------------------
        this._createPlayerAnimations();
        this.player = new Player(this, 0, 0);

        // ------------------------------------------------------------------
        // Perspective
        // ------------------------------------------------------------------
        const p = cfg.perspective;
        this.perspective = {
            topY:     Math.floor(bgH * p.topYRatio),
            bottomY:  Math.floor(bgH * p.bottomYRatio),
            minScale: p.minScale,
            maxScale: p.maxScale,
            smooth:   p.smooth,
        };
        this._applyPerspectiveScale(true);

        // ------------------------------------------------------------------
        // Navigation
        // ------------------------------------------------------------------
        this.navigationSystem = new NavigationSystem(
            this,
            this.player,
            cfg.assets.navmap.key
        );

        // ------------------------------------------------------------------
        // Spawn player at configured position
        // ------------------------------------------------------------------
        const spawnX = Math.floor(bgW * cfg.spawn.xRatio);
        const spawnY = Math.floor(bgH * cfg.spawn.yRatio);
        const spawnPoint = this.navigationSystem.findNearestWalkablePoint(spawnX, spawnY) ?? { x: spawnX, y: spawnY };
        this.player.sprite.setPosition(spawnPoint.x, spawnPoint.y);

        // ------------------------------------------------------------------
        // Occluder (foreground object for y-depth sorting)
        // ------------------------------------------------------------------
        if (cfg.occluder && cfg.assets.occluder) {
            this.occluder = this.add.image(
                Math.floor(bgW * cfg.occluder.xRatio),
                Math.floor(bgH * cfg.occluder.yRatio),
                cfg.assets.occluder.key
            ).setOrigin(0.5, 1);
            this.occluder.setDepth(this.occluder.y);
        }

        // ------------------------------------------------------------------
        // Camera follows player
        // ------------------------------------------------------------------
        this.cameras.main.startFollow(this.player.sprite, false);

        // ------------------------------------------------------------------
        // Dialog system (reusable across all quest triggers in this scene)
        // ------------------------------------------------------------------
        this.dialogSystem = new DialogSystem(this);

        // ------------------------------------------------------------------
        // Interactive zones from config
        // ------------------------------------------------------------------
        this._createZones(cfg.zones ?? [], bgW, bgH);

        // ------------------------------------------------------------------
        // Click-to-move (only when no dialog is active)
        // ------------------------------------------------------------------
        this.input.on('pointerdown', (pointer) => {
            if (this.questRunning) return;
            this.navigationSystem.moveTo(pointer.worldX, pointer.worldY);
        });

        // ------------------------------------------------------------------
        // Resize
        // ------------------------------------------------------------------
        this.scale.on('resize', this._handleResize, this);
        this._handleResize();
    }

    update() {
        if (!this.player) return;

        this.player.update();
        this.navigationSystem?.enforcePlayerOnNavmesh();

        // y-depth sorting: lower on screen = drawn on top
        const playerY = this.player.sprite.y;
        this.player.sprite.setDepth(playerY);

        if (this.occluder) {
            this.occluder.setDepth(this.occluder.y);
        }

        // Perspective scale (pseudo-3D)
        this._applyPerspectiveScale();
    }

    shutdown() {
        this.scale.off('resize', this._handleResize, this);
        this.navigationSystem?.destroy();
        this.dialogSystem?.hide();
    }

    // -------------------------------------------------------------------------
    // Zone management
    // -------------------------------------------------------------------------

    /**
     * Creates interactive zones from the scene config array.
     * Each zone defines a rectangular hit area and a quest slug to trigger.
     *
     * @param {Array}  zones
     * @param {number} bgW
     * @param {number} bgH
     */
    _createZones(zones, bgW, bgH) {
        zones.forEach((zoneCfg) => {
            const x = Math.floor(bgW * zoneCfg.xRatio);
            const y = Math.floor(bgH * zoneCfg.yRatio);

            const zone = this.add.zone(x, y, zoneCfg.width, zoneCfg.height)
                .setName(zoneCfg.key)
                .setInteractive({ useHandCursor: true });

            if (zoneCfg.showDebug) {
                const gfx = this.add.graphics();
                gfx.lineStyle(2, zoneCfg.debugColor ?? 0xffd166, 0.8);
                gfx.strokeRect(x - zoneCfg.width / 2, y - zoneCfg.height / 2, zoneCfg.width, zoneCfg.height);
            }

            zone.on('pointerdown', () => {
                if (this.questRunning) return;
                this._triggerQuestZone(zoneCfg);
            });
        });
    }

    /**
     * Loads the quest graph for the given zone and starts executing it.
     * Called when the player clicks an interactive zone.
     *
     * @param {Object} zoneCfg  Zone config entry from sceneConfig.zones[].
     */
    async _triggerQuestZone(zoneCfg) {
        if (!zoneCfg.questSlug) return;

        this.questRunning = true;
        this.player.stopMovement();

        let questGraph;
        try {
            questGraph = await apiClient.getPublishedQuest(zoneCfg.questSlug);
        } catch (err) {
            console.error(`LocationScene: failed to load quest "${zoneCfg.questSlug}":`, err);
            this.questRunning = false;
            return;
        }

        // Restore saved progress if available, otherwise start fresh.
        const saved = await apiClient.getPlayerProgress(questGraph.id);
        const initialContext = saved?.context ?? {};
        const startNodeOverride = saved?.currentNodeId ?? null;

        this.activeQuest = new QuestEngine(questGraph, initialContext, apiClient);

        // Override start node if resuming a saved session.
        if (startNodeOverride && startNodeOverride !== questGraph.start_node) {
            this.activeQuest.currentNodeId = startNodeOverride;
        }

        await this._runQuestLoop();
    }

    /**
     * Drives the quest execution loop:
     * resolves the next interactive node, displays it, then advances.
     * Repeats until the engine reaches an end node or a null next node.
     */
    async _runQuestLoop() {
        let node = await this.activeQuest.resolveToInteractable();

        while (node) {
            const choiceIndex = await this.dialogSystem.showNode(node);

            if (node.type === 'end') {
                break;
            }

            node = await this.activeQuest.advance(choiceIndex ?? 0);

            if (!node || node.type === 'end') {
                if (node?.type === 'end') {
                    await this.dialogSystem.showNode(node);
                }
                break;
            }
        }

        this.dialogSystem.hide();
        this.activeQuest = null;
        this.questRunning = false;
    }

    // -------------------------------------------------------------------------
    // Perspective
    // -------------------------------------------------------------------------

    /**
     * Scales the player sprite based on vertical position in the scene,
     * simulating perspective depth. Upper = smaller, lower = larger.
     *
     * @param {boolean} force  If true, sets scale instantly without lerp.
     */
    _applyPerspectiveScale(force = false) {
        if (!this.player?.sprite || !this.perspective) return;

        const p = this.perspective;
        const y = this.player.sprite.y;
        const t = Phaser.Math.Clamp((y - p.topY) / (p.bottomY - p.topY), 0, 1);
        const targetScale = Phaser.Math.Linear(p.minScale, p.maxScale, t);

        if (force) {
            this.player.sprite.setScale(targetScale);
            return;
        }

        const current = this.player.sprite.scaleX;
        this.player.sprite.setScale(Phaser.Math.Linear(current, targetScale, p.smooth));
    }

    // -------------------------------------------------------------------------
    // Camera and resize
    // -------------------------------------------------------------------------

    _setupCamera(bgW, bgH) {
        const cam = this.cameras.main;
        cam.setBounds(0, 0, bgW, bgH);
        cam.setDeadzone(100, 100);
        cam.setZoom(1);
    }

    _handleResize() {
        const cam = this.cameras.main;
        const vw = this.scale.width;
        const vh = this.scale.height;
        const bgW = this.backgroundImage?.width ?? vw;
        const bgH = this.backgroundImage?.height ?? vh;

        cam.setViewport(0, 0, vw, vh);

        const offsetX = vw > bgW ? -(vw - bgW) / 2 : 0;
        const offsetY = vh > bgH ? -(vh - bgH) / 2 : 0;

        cam.setBounds(
            offsetX,
            offsetY,
            Math.max(bgW, vw),
            Math.max(bgH, vh)
        );
    }

    // -------------------------------------------------------------------------
    // Player animations
    // -------------------------------------------------------------------------

    /**
     * Registers all directional walk and idle animations for the player sprite.
     * Expects the 'player' spritesheet to be loaded (180×320 px frames).
     *
     * All animation keys follow the convention: <type>_<Direction>
     * Left variants are handled by flipping the corresponding Right animation.
     */
    _createPlayerAnimations() {
        const defs = [
            // Walking
            { key: 'walk_Down',      start: 0,  end: 19, rate: 20 },
            { key: 'walk_DownRight', start: 21, end: 39, rate: 20 },
            { key: 'walk_Right',     start: 40, end: 54, rate: 20 },
            { key: 'walk_Up',        start: 56, end: 69, rate: 20 },
            { key: 'walk_UpRight',   start: 71, end: 84, rate: 20 },
            // Idle
            { key: 'idle_Down',      start: 2,  end: 2,  rate: 5  },
            { key: 'idle_DownRight', start: 23, end: 23, rate: 5  },
            { key: 'idle_Right',     start: 42, end: 43, rate: 5  },
            { key: 'idle_Up',        start: 56, end: 56, rate: 5  },
            { key: 'idle_UpRight',   start: 73, end: 73, rate: 5  },
        ];

        defs.forEach(({ key, start, end, rate }) => {
            if (!this.anims.exists(key)) {
                this.anims.create({
                    key,
                    frames: this.anims.generateFrameNumbers('player', { start, end }),
                    frameRate: rate,
                    repeat: -1,
                });
            }
        });
    }
}

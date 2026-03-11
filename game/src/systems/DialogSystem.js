import Phaser from 'phaser';

/**
 * DialogSystem
 *
 * Reusable Phaser UI layer for rendering quest nodes as interactive dialogs.
 * Extracted from scene-specific code and generalised to handle all node types
 * produced by QuestEngine:
 *
 *   dialogue  — speaker + text + single "Continue" button
 *   choice    — optional prompt text + N option buttons (up to 4 recommended)
 *   end       — outcome text + "Close" button
 *
 * Usage:
 *
 *   const dialog = new DialogSystem(scene);
 *
 *   // showNode returns a Promise:
 *   //   dialogue → resolves with undefined when player clicks Continue
 *   //   choice   → resolves with selected option index (number)
 *   //   end      → resolves with undefined when player closes
 *
 *   const result = await dialog.showNode(node);
 *   await engine.advance(result);
 *
 * The instance keeps a reference to its Phaser container. Calling showNode()
 * while a dialog is open tears down the previous one first.
 */

const SPEAKER_COLOR   = '#c9d1d9';
const TEXT_COLOR      = '#ffffff';
const BUTTON_BG       = '#2d333b';
const BUTTON_BG_HOVER = '#3c444d';
const OUTCOME_COLOR   = '#f9c74f';

export default class DialogSystem {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.active = false;
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Displays the given quest node as a modal dialog.
     *
     * @param {Object} node  Quest node object from QuestEngine.
     * @returns {Promise<number|undefined>}
     */
    showNode(node) {
        this.hide();
        this.active = true;

        return new Promise((resolve) => {
            const L = this._layout();
            this.container = this._buildFrame(L);

            switch (node.type) {
                case 'dialogue':
                    this._renderDialogue(node, L, resolve);
                    break;
                case 'choice':
                    this._renderChoice(node, L, resolve);
                    break;
                case 'end':
                    this._renderEnd(node, L, resolve);
                    break;
                default:
                    console.warn(`DialogSystem: cannot render node type "${node.type}"`);
                    this.hide();
                    resolve(undefined);
            }
        });
    }

    /**
     * Destroys the current dialog container if one is open.
     */
    hide() {
        if (this.container) {
            this.container.destroy(true);
            this.container = null;
        }
        this.active = false;
    }

    isActive() {
        return this.active;
    }

    // -------------------------------------------------------------------------
    // Node renderers
    // -------------------------------------------------------------------------

    _renderDialogue(node, L, resolve) {
        const panelTop = L.cy - L.panelH / 2;
        const wrapW = L.panelW - 48;
        const fontSize = this._fontSize(L, 0.038, 17, 24);

        const items = [];

        if (node.speaker) {
            items.push(
                this.scene.add.text(L.cx, panelTop + 40, node.speaker, {
                    fontFamily: 'Arial',
                    fontSize: `${this._fontSize(L, 0.03, 14, 18)}px`,
                    color: SPEAKER_COLOR,
                }).setOrigin(0.5, 0).setScrollFactor(0)
            );
        }

        const textY = node.speaker ? panelTop + 72 : panelTop + 40;
        items.push(
            this.scene.add.text(L.cx, textY, node.text ?? '', {
                fontFamily: 'Arial',
                fontSize: `${fontSize}px`,
                color: TEXT_COLOR,
                align: 'center',
                wordWrap: { width: wrapW },
            }).setOrigin(0.5, 0).setScrollFactor(0)
        );

        const btnY = L.cy + L.panelH / 2 - 44;
        items.push(
            this._makeButton(L.cx, btnY, 'Продолжить', () => {
                this.hide();
                resolve(undefined);
            })
        );

        this.container.add(items);
    }

    _renderChoice(node, L, resolve) {
        const panelTop = L.cy - L.panelH / 2;
        const wrapW = L.panelW - 48;
        const items = [];

        if (node.text) {
            items.push(
                this.scene.add.text(L.cx, panelTop + 40, node.text, {
                    fontFamily: 'Arial',
                    fontSize: `${this._fontSize(L, 0.032, 15, 20)}px`,
                    color: SPEAKER_COLOR,
                    align: 'center',
                    wordWrap: { width: wrapW },
                }).setOrigin(0.5, 0).setScrollFactor(0)
            );
        }

        const options = node.options ?? [];
        const startY = node.text ? panelTop + 96 : panelTop + 56;
        const stepY = Phaser.Math.Clamp(Math.floor(L.panelH * 0.16), 38, 58);

        options.forEach((opt, idx) => {
            items.push(
                this._makeButton(L.cx, startY + idx * stepY, opt.label, () => {
                    this.hide();
                    resolve(idx);
                })
            );
        });

        this.container.add(items);
    }

    _renderEnd(node, L, resolve) {
        const wrapW = L.panelW - 48;

        const outcomeText = node.outcome === 'completed'
            ? 'Квест завершён.'
            : node.outcome === 'abandoned'
                ? 'Квест прерван.'
                : 'Конец.';

        const items = [
            this.scene.add.text(L.cx, L.cy - 32, outcomeText, {
                fontFamily: 'Arial',
                fontSize: `${this._fontSize(L, 0.038, 18, 26)}px`,
                color: OUTCOME_COLOR,
                align: 'center',
                wordWrap: { width: wrapW },
            }).setOrigin(0.5, 0.5).setScrollFactor(0),

            this._makeButton(L.cx, L.cy + L.panelH / 2 - 44, 'Закрыть', () => {
                this.hide();
                resolve(undefined);
            }),
        ];

        this.container.add(items);
    }

    // -------------------------------------------------------------------------
    // UI helpers
    // -------------------------------------------------------------------------

    _buildFrame(L) {
        const overlay = this.scene.add.rectangle(L.cx, L.cy, L.vw, L.vh, 0x000000, 0.55)
            .setScrollFactor(0)
            .setInteractive(); // blocks clicks from reaching the world

        const panel = this.scene.add.rectangle(L.cx, L.cy, L.panelW, L.panelH, 0x202225, 0.95)
            .setScrollFactor(0)
            .setStrokeStyle(2, 0xffffff, 0.25);

        return this.scene.add.container(0, 0, [overlay, panel]).setDepth(1000);
    }

    _makeButton(x, y, label, onClick) {
        const fontSize = this._fontSize(this._layout(), 0.033, 15, 22);

        const btn = this.scene.add.text(x, y, label, {
            fontFamily: 'Arial',
            fontSize: `${fontSize}px`,
            color: TEXT_COLOR,
            backgroundColor: BUTTON_BG,
            padding: { left: 14, right: 14, top: 7, bottom: 7 },
        }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: BUTTON_BG_HOVER }));
        btn.on('pointerout',  () => btn.setStyle({ backgroundColor: BUTTON_BG }));
        btn.on('pointerdown', onClick);

        return btn;
    }

    _layout() {
        const vw = this.scene.scale.width;
        const vh = this.scene.scale.height;
        const margin = Math.round(Math.min(vw, vh) * 0.04);

        return {
            vw,
            vh,
            cx: vw * 0.5,
            cy: vh * 0.5,
            panelW: Phaser.Math.Clamp(vw - margin * 2, 280, 640),
            panelH: Phaser.Math.Clamp(vh - margin * 2, 240, 380),
        };
    }

    /**
     * Responsive font size clamped between min and max pixels.
     *
     * @param {Object} L       Layout object from _layout().
     * @param {number} ratio   Fraction of panelW.
     * @param {number} min     Minimum px.
     * @param {number} max     Maximum px.
     * @returns {number}
     */
    _fontSize(L, ratio, min, max) {
        return Phaser.Math.Clamp(Math.floor(L.panelW * ratio), min, max);
    }
}

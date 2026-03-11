import Phaser from 'phaser';
import hubSceneConfig from '../data/scenes/hub.json';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Splash screen assets
        this.load.image('preload_bg', '/assets/preload_bg.png');
        this.load.image('logo', '/assets/logo.png');

        // Global game assets used across all locations
        this.load.spritesheet('player', '/assets/player_spritesheet2.png', {
            frameWidth: 180,
            frameHeight: 320
        });

        // Scene-specific assets are loaded by LocationScene.preload()
        // after receiving the scene config object.

        this.load.once('filecomplete-image-preload_bg', () => {
            this.add.image(width / 2, height / 2, 'preload_bg');
        });

        this.load.once('filecomplete-image-logo', () => {
            this.add.image(width / 2, height / 2 - 150, 'logo');
        });

        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 + 100, 320, 50);

        const progressBar = this.add.graphics();

        const loadingText = this.add.text(width / 2, height / 2 + 50, 'Loading...', {
            font: '20px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        const percentText = this.add.text(width / 2, height / 2 + 125, '0%', {
            font: '18px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 110, 300 * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        this.load.on('loaderror', (file) => {
            console.error(`PreloadScene: failed to load asset: ${file.key}`);
        });
    }

    create() {
        console.log('PreloadScene: global assets loaded');
        // Pass the scene config for the first location.
        // When a scene-selection or world-map system is added, this
        // call site is where you'd determine which sceneConfig to pass.
        this.scene.start('LocationScene', { sceneConfig: hubSceneConfig });
    }
}

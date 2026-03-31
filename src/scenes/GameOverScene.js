export class GameOverScene extends Phaser.Scene {
	constructor () {
		super({ key: 'GameOverScene' });
	};
	
	init (data) {
		this.stats = data;
	};
	
	create () {
		const { width, height } = this.scale;
		
		// Background overlay
		const overlay = this.add.graphics();
		overlay.fillStyle(0x000000, 0.8);
		overlay.fillRect(0, 0, width, height);
		
		// MODIFIED: Zooming Game Over Text
		const title = this.add.text(width / 2, height / 2 - 100, 'GAME OVER', {
			fontSize: '80px',
			fontStyle: 'bold',
			fill: '#ffffff',
			stroke: '#ff0000',
			strokeThickness: 8
		}).setOrigin(0.5);
		
		this.tweens.add({
			targets: title,
			scale: { from: 0.8, to: 1.2 },
			duration: 1000,
			yoyo: true,
			repeat: -1,
			ease: 'Sine.easeInOut'
		});
		
		// Stats display
		this.add.text(width / 2, height / 2 + 20, `Accuracy: ${this.stats.accuracy}%`, {
			fontSize: '32px',
			fill: '#00ffff'
		}).setOrigin(0.5);
		
		this.add.text(width / 2, height / 2 + 70, 'Click to Restart', {
			fontSize: '24px',
			fill: '#aaaaaa'
		}).setOrigin(0.5);
		
		// MODIFIED: Fireworks logic using particle emitters
		this.createFireworks();
		
		this.input.once('pointerdown', () => {
			window.location.reload();
		});
	};
	
	createFireworks () {
		// Generate a small circle texture for particles
		const graphics = this.make.graphics({ x: 0, y: 0, add: false });
		graphics.fillStyle(0xffffff);
		graphics.fillCircle(4, 4, 4);
		graphics.generateTexture('spark', 8, 8);
		
		this.time.addEvent({
			delay: 600,
			callback: () => {
				const x = Phaser.Math.Between(100, this.scale.width - 100);
				const y = Phaser.Math.Between(100, this.scale.height - 300);
				const color = Phaser.Math.RND.pick([0xff0000, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff]);
				
				const emitter = this.add.particles(x, y, 'spark', {
					speed: { min: 50, max: 150 },
					angle: { min: 0, max: 360 },
					scale: { start: 1, end: 0 },
					lifespan: 1000,
					gravityY: 100,
					tint: color,
					quantity: 30,
					emitting: false
				});
				
				emitter.explode(30);
				
				// Cleanup emitter after explosion
				this.time.delayedCall(1500, () => emitter.destroy());
			},
			repeat: -1
		});
	};
};

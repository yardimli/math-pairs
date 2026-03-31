import { CardManager } from '../managers/CardManager.js';
import { InputManager } from '../managers/InputManager.js';

export class MatchGameScene extends Phaser.Scene {
	constructor () {
		super({ key: 'MatchGameScene' });
	};
	
	preload () {
		this.load.audio('bounce', 'assets/audio/basketball_bounce_single_3.wav');
		this.load.audio('win', 'assets/audio/Drop Game Potion.wav');
		this.load.audio('click', 'assets/audio/basketball_bounce_single_5.wav');
		this.load.audio('fail', 'assets/audio/Hit Item Dropped 2.wav');
	};
	
	create () {
		// MODIFIED: Get new settings from registry, including float controls
		const gridSize = this.registry.get('gridSize');
		const targetSum = this.registry.get('targetSum');
		const floatMargin = this.registry.get('floatMargin');
		const floatSpeed = this.registry.get('floatSpeed');
		
		this.pairsFound = 0;
		this.totalAttempts = 0;
		
		this.createBackground();
		
		this.cardManager = new CardManager(this);
		this.inputManager = new InputManager(this);
		
		// MODIFIED: Pass new settings to the create method
		const totalCards = this.cardManager.create(gridSize, targetSum, floatMargin, floatSpeed);
		this.totalPairs = totalCards / 2;
		
		this.inputManager.create();
		this.createSegmentedBars();
		
		this.scale.on('resize', this.resize, this);
	};
	
	createBackground () {
		const { width, height } = this.scale;
		this.bg = this.add.graphics();
		this.bg.fillGradientStyle(0x1a2a6c, 0x1a2a6c, 0xb21f1f, 0xb21f1f, 1);
		this.bg.fillRect(0, 0, width, height);
	};
	
	// MODIFIED: This function now shows the full equation of the matched pair.
	showFadedNumber (sum, num1, num2) {
		const { width, height } = this.scale;
		// Create the equation string from the matched card values.
		const equation = `${num1} + ${num2} = ${sum}`;
		const numText = this.add.text(width / 2, height / 2, equation, {
			fontSize: '150px', // Adjusted font size for better fit
			fontFamily: 'Arial',
			fontStyle: 'bold',
			color: '#00ff00', // Changed color for positive feedback
			stroke: '#000000',
			strokeThickness: 8
		}).setOrigin(0.5).setAlpha(0);
		
		this.tweens.add({
			targets: numText,
			alpha: { from: 0.8, to: 0 }, // Made it slightly more visible
			scale: { from: 0.8, to: 1.2 }, // Added a subtle zoom
			duration: 1500,
			ease: 'Sine.easeInOut',
			onComplete: () => {
				numText.destroy();
			}
		});
	};
	
	createSegmentedBars () {
		const { width, height } = this.scale;
		
		// --- Top Bar (Progress) ---
		this.topSegments =[];
		const topPadding = 50;
		const topBarHeight = 30;
		const totalTopSegments = this.totalPairs * 10;
		const segmentWidth = (width - (topPadding * 2)) / totalTopSegments;
		
		for (let i = 0; i < totalTopSegments; i++) {
			const seg = this.add.rectangle(
				topPadding + (i * segmentWidth) + (segmentWidth / 2),
				40,
				segmentWidth - 1,
				topBarHeight,
				0x222222
			);
			this.topSegments.push(seg);
		}
		
		this.progressText = this.add.text(width / 2, 40, 'PROGRESS: 0%', {
			fontSize: '18px',
			fill: '#00ffff',
			fontStyle: 'bold'
		}).setOrigin(0.5).setStroke('#000000', 4);
		
		// --- Right Bar (Accuracy) ---
		this.rightSegments =[];
		const rightBarWidth = 30;
		const totalRightSegments = 100;
		const rightBarHeight = height - 200;
		const segmentHeight = rightBarHeight / totalRightSegments;
		
		for (let i = 0; i < totalRightSegments; i++) {
			const seg = this.add.rectangle(
				width - 40,
				height - 100 - (i * segmentHeight) - (segmentHeight / 2),
				rightBarWidth,
				segmentHeight - 1,
				0x222222
			);
			this.rightSegments.push(seg);
		}
		
		this.accuracyText = this.add.text(width - 40, height / 2, 'ACCURACY: 0%', {
			fontSize: '18px',
			fill: '#ff00ff',
			fontStyle: 'bold'
		}).setOrigin(0.5).setAngle(90).setStroke('#000000', 4);
	};
	
	updateUI () {
		const progressPercent = (this.pairsFound / this.totalPairs);
		const activeTop = Math.floor(progressPercent * this.topSegments.length);
		
		this.topSegments.forEach((seg, i) => {
			if (i < activeTop) {
				seg.setFillStyle(0x00ff00);
			}
		});
		this.progressText.setText(`PROGRESS: ${Math.round(progressPercent * 100)}%`);
		this.children.bringToTop(this.progressText);
		
		const accuracy = this.totalAttempts > 0 ? (this.pairsFound / this.totalAttempts) : 0;
		const activeRight = Math.floor(accuracy * this.rightSegments.length);
		
		this.rightSegments.forEach((seg, i) => {
			if (i < activeRight) {
				seg.setFillStyle(0xff00ff);
			} else {
				seg.setFillStyle(0x222222);
			}
		});
		this.accuracyText.setText(`ACCURACY: ${Math.round(accuracy * 100)}%`);
		this.children.bringToTop(this.accuracyText);
	};
	
	// MODIFIED: Pass time and delta to the card manager's update method
	update (time, delta) {
		this.inputManager.update();
		if (this.cardManager) {
			this.cardManager.update(time, delta); // Pass arguments here
		}
	};
	
	resize (gameSize) {
		const { width, height } = gameSize;
		this.bg.clear();
		this.bg.fillGradientStyle(0x1a2a6c, 0x1a2a6c, 0xb21f1f, 0xb21f1f, 1);
		this.bg.fillRect(0, 0, width, height);
	};
};

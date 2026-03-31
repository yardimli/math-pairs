import { CardManager } from '../managers/CardManager.js'; // Used for card styling consistency

export class TutorialScene extends Phaser.Scene {
	constructor () {
		super({ key: 'TutorialScene' });
	}
	
	create () {
		const { width, height } = this.scale;
		const targetSum = this.registry.get('targetSum');
		
		// Create a dark overlay for focus
		this.add.graphics()
			.fillStyle(0x000000, 0.8)
			.fillRect(0, 0, width, height);
		
		// --- Tutorial Text ---
		this.add.text(width / 2, 100, 'HOW TO PLAY', {
			fontSize: '48px',
			fontStyle: 'bold',
			color: '#ffffff'
		}).setOrigin(0.5);
		
		this.add.text(width / 2, 160, `Drag a number card onto another to make the sum of ${targetSum}.`, {
			fontSize: '24px',
			color: '#dddddd'
		}).setOrigin(0.5);
		
		// --- Grid and Card Creation ---
		const cardSize = 120;
		const gridCols = 3;
		const gridRows = 2;
		const gridWidth = gridCols * (cardSize * 1.5);
		const gridHeight = gridRows * (cardSize * 1.5);
		const gridStartX = (width - gridWidth) / 2;
		const gridStartY = (height - gridHeight) / 2 + 50;
		
		const cellWidth = gridWidth / gridCols;
		const cellHeight = gridHeight / gridRows;
		
		// Generate card values
		const value1 = Phaser.Math.Between(1, targetSum - 1);
		const value2 = targetSum - value1;
		
		const correctValues = [value1, value2];
		const wrongValues = [];
		let wrongValue;
		
		// Generate four unique wrong numbers.
		for (let i = 0; i < (gridCols * gridRows) - 2; i++) {
			do {
				wrongValue = Phaser.Math.Between(1, targetSum - 1);
			} while (wrongValue === value1 || wrongValue === value2);
			wrongValues.push(wrongValue);
		}
		
		const cardData = Phaser.Utils.Array.Shuffle([...correctValues, ...wrongValues]);
		const allCards = [];
		
		// Create and position all cards in the grid first
		for (let i = 0; i < cardData.length; i++) {
			const row = Math.floor(i / gridCols);
			const col = i % gridCols;
			
			const x = gridStartX + (col * cellWidth) + (cellWidth / 2);
			const y = gridStartY + (row * cellHeight) + (cellHeight / 2);
			
			const cardValue = cardData[i];
			const card = this.createTutorialCard(x, y, cardValue, cardSize);
			allCards.push(card);
		}
		
		// NEW: Reliably find the two correct card objects after they've been created.
		// This fixes the bug where the same card was chosen twice.
		let card1, card2;
		if (value1 === value2) {
			const matchingCards = allCards.filter(c => c.getData('value') === value1);
			card1 = matchingCards[0];
			card2 = matchingCards[1];
		} else {
			card1 = allCards.find(c => c.getData('value') === value1);
			card2 = allCards.find(c => c.getData('value') === value2);
		}
		
		// --- Cursor Simulation ---
		const cursor = this.add.graphics();
		cursor.fillStyle(0xffffff);
		cursor.beginPath();
		cursor.moveTo(0, 0);
		cursor.lineTo(30, 40);
		cursor.lineTo(10, 45);
		cursor.lineTo(0, 50);
		cursor.closePath();
		cursor.fillPath();
		cursor.setDepth(100); // Ensure cursor is on top
		cursor.setPosition(card1.x - 50, card1.y - 50);
		
		// --- Equation Text (initially hidden) ---
		const equationText = this.add.text(width / 2, height / 2, `${card1.getData('value')} + ${card2.getData('value')} = ${targetSum}`, {
			fontSize: '64px',
			fontStyle: 'bold',
			color: '#00ff00',
			stroke: '#000000',
			strokeThickness: 6
		}).setOrigin(0.5).setAlpha(0).setScale(0.5);
		
		// --- Animation Sequence ---
		this.tweens.add({
			targets: cursor,
			x: card1.x,
			y: card1.y,
			duration: 1000,
			ease: 'Sine.easeInOut',
			onComplete: () => {
				// MODIFIED: Set depth to make the dragged card float above others.
				card1.setDepth(99);
				
				this.tweens.add({
					// MODIFIED: This now correctly targets two different card objects.
					targets: [cursor, card1],
					x: card2.x,
					y: card2.y,
					duration: 2000,
					ease: 'Sine.easeInOut',
					onComplete: () => {
						// Show the equation text with a pop effect.
						this.tweens.add({
							targets: equationText,
							alpha: 1,
							scale: 1,
							duration: 500,
							ease: 'Back.easeOut'
						});
						
						// Fade out all cards and the cursor.
						this.tweens.add({
							targets: [...allCards, cursor],
							alpha: 0,
							duration: 500
						});
					}
				});
			}
		});
		
		// --- Proceed to Game ---
		this.time.delayedCall(5000, () => {
			this.cameras.main.fadeOut(500, 0, 0, 0);
			this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
				this.scene.start('MatchGameScene');
			});
		});
	}
	
	/**
	 * Creates a visual card for the tutorial.
	 * @param {number} x - The x position.
	 * @param {number} y - The y position.
	 * @param {number} value - The number to display on the card.
	 * @param {number} size - The size of the card.
	 * @returns {Phaser.GameObjects.Container} The created card container.
	 */
	createTutorialCard (x, y, value, size) {
		const container = this.add.container(x, y);
		container.setData('value', value);
		
		const rect = this.add.rectangle(0, 0, size, size, 0x333333);
		rect.setStrokeStyle(2, 0xffffff, 0.8);
		
		const textStyle = {
			fontSize: `${Math.floor(size * 0.5)}px`,
			fontFamily: 'Arial',
			fontStyle: 'bold',
			color: '#ffffff',
			stroke: '#000000',
			strokeThickness: 5
		};
		const textObj = this.add.text(0, 0, value.toString(), textStyle).setOrigin(0.5);
		
		container.add([rect, textObj]);
		return container;
	}
}

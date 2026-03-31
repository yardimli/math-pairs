export class CardManager {
	constructor (scene) {
		this.scene = scene;
		this.cards = [];
	};
	
	create (gridSize, targetSum) {
		this.targetSum = targetSum;
		
		const totalSlots = gridSize * gridSize;
		const totalCards = totalSlots % 2 === 0 ? totalSlots : totalSlots - 1;
		const { width, height } = this.scene.scale;
		
		const cardDataPool = this.generateCardData(totalCards / 2, targetSum);
		Phaser.Utils.Array.Shuffle(cardDataPool);
		
		const padding = 100;
		const gridW = width - (padding * 2);
		const gridH = height - (padding * 2);
		const cellW = gridW / gridSize;
		const cellH = gridH / gridSize;
		
		// MODIFIED: Calculate card size dynamically
		// Use the smaller of the two cell dimensions to ensure it fits
		const cellSize = Math.min(cellW, cellH);
		// Set the card size to be a percentage of the cell size to create margins
		const cardSize = cellSize * 0.85;
		
		const cardPairs = [];
		for (let i = 0; i < cardDataPool.length; i += 2) {
			cardPairs.push([cardDataPool[i], cardDataPool[i + 1]]);
		}
		
		let cardIndex = 0;
		for (let i = 0; i < totalCards; i++) {
			const row = Math.floor(i / gridSize);
			const col = i % gridSize;
			const x = padding + (col * cellW) + (cellW / 2);
			const y = padding + (row * cellH) + (cellH / 2);
			
			const data = cardDataPool[cardIndex++];
			if (data) {
				// MODIFIED: Pass the calculated cardSize to the spawn function
				this.spawnCard(x, y, data, cardSize);
			}
		}
		
		this.scene.physics.add.collider(this.cards, this.cards, null, (obj1, obj2) => {
			if (obj1.targetX !== undefined || obj2.targetX !== undefined) {
				return false;
			}
			
			const dragged = this.scene.inputManager.draggedCard;
			if (dragged && (obj1 === dragged || obj2 === dragged)) {
				return false;
			}
			
			return true;
		}, this);
		
		return totalCards;
	};
	
	generateCardData (pairsNeeded, targetSum) {
		let pool = [];
		let usedNumbers = new Set();
		
		for (let i = 0; i < pairsNeeded; i++) {
			let num1, num2;
			let attempts = 0;
			
			do {
				num1 = Phaser.Math.Between(1, targetSum - 1);
				num2 = targetSum - num1;
				attempts++;
				if (attempts > 100) {
					console.error("Could not find a unique pair.");
					break;
				}
			} while (num1 === num2 || usedNumbers.has(num1) || usedNumbers.has(num2));
			
			usedNumbers.add(num1);
			usedNumbers.add(num2);
			
			pool.push({
				matchValue: num1,
				display: num1.toString()
			});
			pool.push({
				matchValue: num2,
				display: num2.toString()
			});
		}
		return pool;
	};
	
	// MODIFIED: spawnCard now accepts a 'size' parameter
	spawnCard (x, y, data, size) {
		const container = this.scene.add.container(x, y);
		
		const visualColor = 0x333333;
		
		// MODIFIED: Shadow offset is now proportional to the card size
		const shadowOffset = size * 0.05;
		const shadow = this.scene.add.rectangle(shadowOffset, shadowOffset, size, size, 0x000000, 0.3);
		container.add(shadow);
		
		const rect = this.scene.add.rectangle(0, 0, size, size, visualColor);
		rect.setStrokeStyle(2, 0xffffff, 0.8);
		container.add(rect);
		
		// MODIFIED: Bevel effects are now drawn based on the dynamic size
		const highlight = this.scene.add.graphics();
		highlight.lineStyle(3, 0xffffff, 0.5);
		highlight.lineBetween(-size / 2, -size / 2, size / 2, -size / 2);
		highlight.lineBetween(-size / 2, -size / 2, -size / 2, size / 2);
		
		const lowlight = this.scene.add.graphics();
		lowlight.lineStyle(3, 0x000000, 0.3);
		lowlight.lineBetween(-size / 2, size / 2, size / 2, size / 2);
		lowlight.lineBetween(size / 2, -size / 2, size / 2, size / 2);
		
		container.add([highlight, lowlight]);
		
		// MODIFIED: Font size is now proportional to the card size
		const textStyle = {
			fontSize: `${Math.floor(size * 0.5)}px`, // Font size is half the card height
			fontFamily: 'Arial',
			fontStyle: 'bold',
			color: '#ffffff',
			stroke: '#000000',
			strokeThickness: 5
		};
		
		const textObj = this.scene.add.text(0, 0, data.display, textStyle).setOrigin(0.5);
		container.add(textObj);
		
		container.setSize(size, size);
		container.matchValue = data.matchValue;
		container.isCard = true;
		container.cardSize = size; // NEW: Store the size on the card for later use
		
		this.scene.physics.add.existing(container);
		container.body.setCollideWorldBounds(true);
		container.body.setBounce(0.2, 0.2);
		container.body.setDamping(true);
		container.body.setDrag(0.85);
		
		container.body.setVelocity(Phaser.Math.Between(-10, 10), Phaser.Math.Between(-10, 10));
		
		container.setInteractive();
		this.cards.push(container);
	};
	
	applyProximityEffect (activeCard) {};
	
	handleDrop (card, startX, startY) {
		let matched = false;
		this.scene.totalAttempts++;
		
		const target = this.cards.find(t => {
			if (t === card) return false;
			const dist = Phaser.Math.Distance.Between(card.x, card.y, t.x, t.y);
			// MODIFIED: The drop distance check is now based on the card's size
			return dist < card.cardSize * 0.8 && (t.matchValue + card.matchValue) === this.targetSum;
		});
		
		if (target) {
			matched = true;
			this.match(card, target);
		}
		
		if (!matched) {
			this.scene.sound.play('fail', { volume: 0.5 });
			
			card.body.setVelocity(0, 0);
			this.scene.tweens.add({
				targets: card,
				x: startX,
				y: startY,
				duration: 300,
				ease: 'Power2'
			});
		}
		this.scene.updateUI();
	};
	
	match (c1, c2) {
		this.scene.sound.play('win');
		this.scene.pairsFound++;
		this.cards = this.cards.filter(c => c !== c1 && c !== c2);
		
		this.scene.showFadedNumber(this.targetSum);
		
		[c1, c2].forEach(c => {
			c.body.enable = false;
			this.scene.tweens.add({
				targets: c,
				scale: 2,
				alpha: 0,
				duration: 400,
				onComplete: () => {
					c.destroy();
					if (this.cards.length === 0) {
						this.scene.time.delayedCall(500, () => {
							this.scene.scene.start('GameOverScene', {
								attempts: this.scene.totalAttempts,
								accuracy: this.scene.totalAttempts > 0 ? Math.round((this.scene.totalPairs / this.scene.totalAttempts) * 100) : 0
							});
						});
					}
				}
			});
		});
	};
	
	reorganizeGrid () {};
	
	update () {};
};

export class CardManager {
	constructor (scene) {
		this.scene = scene;
		this.cards = [];
	};
	
	// MODIFIED: create now accepts floatMargin and floatSpeed
	create (gridSize, targetSum, floatMargin, floatSpeed) {
		this.targetSum = targetSum;
		this.floatMargin = floatMargin; // NEW: Store float margin
		this.floatSpeed = floatSpeed; // NEW: Store float speed
		
		const totalSlots = gridSize * gridSize;
		const totalCards = totalSlots % 2 === 0 ? totalSlots : totalSlots - 1;
		const { width, height } = this.scene.scale;
		
		const cardDataPool = this.generateCardData(totalCards / 2, targetSum);
		Phaser.Utils.Array.Shuffle(cardDataPool);
		
		// MODIFIED: Padding calculation ensures equal spacing
		const paddingX = 100;
		const paddingY = 100;
		const gridW = width - (paddingX * 2);
		const gridH = height - (paddingY * 2);
		const cellW = gridW / gridSize;
		const cellH = gridH / gridSize;
		
		const cellSize = Math.min(cellW, cellH);
		const cardSize = cellSize * 0.85;
		
		const cardPairs = [];
		for (let i = 0; i < cardDataPool.length; i += 2) {
			cardPairs.push([cardDataPool[i], cardDataPool[i + 1]]);
		}
		
		let cardIndex = 0;
		for (let i = 0; i < totalCards; i++) {
			const row = Math.floor(i / gridSize);
			const col = i % gridSize;
			// MODIFIED: Card positions are centered within cells for equal spacing
			const x = paddingX + (col * cellW) + (cellW / 2);
			const y = paddingY + (row * cellH) + (cellH / 2);
			
			const data = cardDataPool[cardIndex++];
			if (data) {
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
	
	spawnCard (x, y, data, size) {
		const container = this.scene.add.container(x, y);
		
		const visualColor = 0x333333;
		
		const shadowOffset = size * 0.05;
		const shadow = this.scene.add.rectangle(shadowOffset, shadowOffset, size, size, 0x000000, 0.3);
		container.add(shadow);
		
		const rect = this.scene.add.rectangle(0, 0, size, size, visualColor);
		rect.setStrokeStyle(2, 0xffffff, 0.8);
		container.add(rect);
		
		const highlight = this.scene.add.graphics();
		highlight.lineStyle(3, 0xffffff, 0.5);
		highlight.lineBetween(-size / 2, -size / 2, size / 2, -size / 2);
		highlight.lineBetween(-size / 2, -size / 2, -size / 2, size / 2);
		
		const lowlight = this.scene.add.graphics();
		lowlight.lineStyle(3, 0x000000, 0.3);
		lowlight.lineBetween(-size / 2, size / 2, size / 2, size / 2);
		lowlight.lineBetween(size / 2, -size / 2, size / 2, size / 2);
		
		container.add([highlight, lowlight]);
		
		const textStyle = {
			fontSize: `${Math.floor(size * 0.5)}px`,
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
		container.cardSize = size;
		
		// NEW: Store initial position for floating animation
		container.startX = x;
		container.startY = y;
		// NEW: Initialize a random direction vector for movement
		container.moveDirection = new Phaser.Math.Vector2(
			Phaser.Math.RND.pick([-1, 1]),
			Phaser.Math.RND.pick([-1, 1])
		).normalize();
		
		this.scene.physics.add.existing(container);
		container.body.setCollideWorldBounds(true);
		container.body.setBounce(0.2, 0.2);
		container.body.setDamping(true);
		container.body.setDrag(0.85);
		
		// REMOVED: Initial random velocity is no longer needed
		
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
	
	// MODIFIED: update now handles the floating animation
	update () {
		// Get the currently dragged card, if any
		const draggedCard = this.scene.inputManager.draggedCard;
		
		this.cards.forEach(card => {
			// Only apply floating animation to cards that are not being dragged
			if (card !== draggedCard) {
				// Reverse direction if card hits the horizontal margin
				if (Math.abs(card.x - card.startX) >= this.floatMargin) {
					card.moveDirection.x *= -1;
					// Clamp position to prevent exceeding the margin
					card.x = Phaser.Math.Clamp(card.x, card.startX - this.floatMargin, card.startX + this.floatMargin);
				}
				
				// Reverse direction if card hits the vertical margin
				if (Math.abs(card.y - card.startY) >= this.floatMargin) {
					card.moveDirection.y *= -1;
					// Clamp position to prevent exceeding the margin
					card.y = Phaser.Math.Clamp(card.y, card.startY - this.floatMargin, card.startY + this.floatMargin);
				}
				
				// Apply velocity based on the direction and speed
				card.body.setVelocity(
					card.moveDirection.x * this.floatSpeed,
					card.moveDirection.y * this.floatSpeed
				);
			}
		});
	};
};

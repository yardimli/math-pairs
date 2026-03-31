export class CardManager {
	constructor (scene) {
		this.scene = scene;
		this.cards =[];
	};
	
	// MODIFIED: The grid calculation logic has been updated to ensure equal horizontal and vertical spacing.
	create (gridSize, targetSum, floatMargin, floatSpeed) {
		this.targetSum = targetSum;
		this.floatMargin = floatMargin;
		this.floatSpeed = floatSpeed;
		
		const totalSlots = gridSize * gridSize;
		const totalCards = totalSlots % 2 === 0 ? totalSlots : totalSlots - 1;
		const { width, height } = this.scene.scale;
		
		const cardDataPool = this.generateCardData(totalCards / 2, targetSum);
		Phaser.Utils.Array.Shuffle(cardDataPool);
		
		// --- START: Grid Calculation Block ---
		
		// Define a base padding from the edges of the screen.
		const padding = 100;
		
		// Calculate the total available area for the grid after applying padding.
		const availableWidth = width - (padding * 2);
		const availableHeight = height - (padding * 2);
		
		// To create a square grid, we must use the smaller of the two dimensions as our limiting size.
		const gridAreaSize = Math.min(availableWidth, availableHeight);
		
		// The size of each cell is now uniform because the grid area is a perfect square.
		const cellSize = gridAreaSize / gridSize;
		
		// The card's visual size is a percentage of the cell size to create spacing.
		const cardSize = cellSize * 0.85;
		
		// Calculate the remaining space on each axis to center the grid perfectly.
		const offsetX = (availableWidth - gridAreaSize) / 2;
		const offsetY = (availableHeight - gridAreaSize) / 2;
		
		// The starting point for the grid is the base padding plus the centering offset.
		const gridStartX = padding + offsetX;
		const gridStartY = padding + offsetY;
		
		// --- END: Grid Calculation Block ---
		
		const cardPairs =[];
		for (let i = 0; i < cardDataPool.length; i += 2) {
			cardPairs.push([cardDataPool[i], cardDataPool[i + 1]]);
		}
		
		let cardIndex = 0;
		for (let i = 0; i < totalCards; i++) {
			const row = Math.floor(i / gridSize);
			const col = i % gridSize;
			
			// MODIFIED: Card positions are now calculated using the new centered starting points and the single cellSize.
			const x = gridStartX + (col * cellSize) + (cellSize / 2);
			const y = gridStartY + (row * cellSize) + (cellSize / 2);
			
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
		let pool =[];
		let usedNumbers = new Set();
		
		for (let i = 0; i < pairsNeeded; i++) {
			let num1, num2;
			num1 = Phaser.Math.Between(1, targetSum - 1);
			num2 = targetSum - num1;
			
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
		container.startX = x;
		container.startY = y;
		
		container.floatVx = 0;
		container.floatVy = 0;
		
		this._setRandomFloatDirection(container);
		
		this.scene.physics.add.existing(container);
		container.body.setCollideWorldBounds(true);
		container.body.setBounce(0.2, 0.2);
		container.body.setDamping(false);
		container.body.setDrag(600);
		
		container.setInteractive();
		this.cards.push(container);
	};
	
	_setRandomFloatDirection (card) {
		const speed = Phaser.Math.Between(1, this.floatSpeed);
		const speedPerMs = speed / 1000;
		const direction = Phaser.Math.RND.pick([-1, 1]);
		
		if (Phaser.Math.RND.pick(['x', 'y']) === 'x') {
			card.floatVx = speedPerMs * direction;
			card.floatVy = 0;
		} else {
			card.floatVx = 0;
			card.floatVy = speedPerMs * direction;
		}
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
			card.isReturning = true;
			
			this.scene.tweens.add({
				targets: card,
				x: startX,
				y: startY,
				duration: 300,
				ease: 'Power2',
				onComplete: () => {
					card.isReturning = false;
				}
			});
		}
		this.scene.updateUI();
	};
	
	match (c1, c2) {
		// NEW: Disable interaction immediately to prevent the bug.
		c1.disableInteractive();
		c2.disableInteractive();
		
		this.scene.sound.play('win');
		this.scene.pairsFound++;
		this.cards = this.cards.filter(c => c !== c1 && c !== c2);
		
		// MODIFIED: Pass the matched card values to show the full equation.
		this.scene.showFadedNumber(this.targetSum, c1.matchValue, c2.matchValue);
		
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
	
	update (time, delta) {
		const draggedCard = this.scene.inputManager.draggedCard;
		const dt = delta || 16.6;
		
		this.cards.forEach(card => {
			if (card !== draggedCard && !card.isReturning) {
				card.x += card.floatVx * dt;
				card.y += card.floatVy * dt;
				
				const hitHorizontalMargin = (card.floatVx > 0 && card.x > card.startX + this.floatMargin) ||
					(card.floatVx < 0 && card.x < card.startX - this.floatMargin);
				
				const hitVerticalMargin = (card.floatVy > 0 && card.y > card.startY + this.floatMargin) ||
					(card.floatVy < 0 && card.y < card.startY - this.floatMargin);
				
				if (hitHorizontalMargin || hitVerticalMargin) {
					card.x = Phaser.Math.Clamp(card.x, card.startX - this.floatMargin, card.startX + this.floatMargin);
					card.y = Phaser.Math.Clamp(card.y, card.startY - this.floatMargin, card.startY + this.floatMargin);
					
					this._setRandomFloatDirection(card);
				}
			}
		});
	};
};

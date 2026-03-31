export class InputManager {
	constructor (scene) {
		this.scene = scene;
		this.draggedCard = null;
		this.pointer = null;
		this.lastX = 0;
		this.lastY = 0;
		// NEW: Properties to store the starting position of a dragged card
		this.dragStartX = 0;
		this.dragStartY = 0;
	};
	
	create () {
		this.scene.input.on('pointerdown', (pointer, targets) => {
			if (targets.length > 0 && targets[0].isCard) {
				this.draggedCard = targets[0];
				this.pointer = pointer;
				this.lastX = this.draggedCard.x;
				this.lastY = this.draggedCard.y;
				
				// MODIFIED: Store the initial position when the drag starts
				this.dragStartX = this.draggedCard.x;
				this.dragStartY = this.draggedCard.y;
				
				this.scene.sound.play('click');
				this.scene.children.bringToTop(this.draggedCard);
				
				this.draggedCard.body.setDamping(false);
			}
		});
		
		this.scene.input.on('pointermove', (pointer) => {
			this.pointer = pointer;
		});
		
		this.scene.input.on('pointerup', () => {
			if (this.draggedCard) {
				this.draggedCard.body.setDamping(true);
				// MODIFIED: Pass the starting position to the drop handler
				this.scene.cardManager.handleDrop(this.draggedCard, this.dragStartX, this.dragStartY);
				this.draggedCard = null;
			}
		});
	};
	
	update () {
		if (this.draggedCard && this.pointer) {
			const speed = 25;
			const maxVelocity = 1500;
			
			let vX = (this.pointer.x - this.draggedCard.x) * speed;
			let vY = (this.pointer.y - this.draggedCard.y) * speed;
			
			vX = Phaser.Math.Clamp(vX, -maxVelocity, maxVelocity);
			vY = Phaser.Math.Clamp(vY, -maxVelocity, maxVelocity);
			
			this.draggedCard.body.setVelocity(vX, vY);
			
			const dragDX = this.draggedCard.x - this.lastX;
			const dragDY = this.draggedCard.y - this.lastY;
			
			// Apply wind effect to nearby cards
			this.scene.cardManager.cards.forEach(card => {
				if (card === this.draggedCard) return;
				
				const dist = Phaser.Math.Distance.Between(this.draggedCard.x, this.draggedCard.y, card.x, card.y);
				const windRadius = 120;
				
				if (dist < windRadius) {
					const intensity = (1 - (dist / windRadius)) * 0.5;
					card.body.velocity.x += dragDX * intensity;
					card.body.velocity.y += dragDY * intensity;
				}
			});
			
			this.lastX = this.draggedCard.x;
			this.lastY = this.draggedCard.y;
		}
	};
};

export class InputManager {
	constructor (scene) {
		this.scene = scene;
		this.draggedCard = null;
		this.pointer = null;
		// MODIFIED: lastX and lastY are no longer needed as the "wind effect" is removed.
		this.dragStartX = 0;
		this.dragStartY = 0;
	};
	
	create () {
		this.scene.input.on('pointerdown', (pointer, targets) => {
			if (targets.length > 0 && targets[0].isCard) {
				this.draggedCard = targets[0];
				
				if (this.draggedCard.isReturning) {
					this.scene.tweens.killTweensOf(this.draggedCard);
					this.draggedCard.isReturning = false;
				}
				
				this.pointer = pointer;
				
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
				this.scene.cardManager.handleDrop(this.draggedCard, this.dragStartX, this.dragStartY);
				this.draggedCard = null;
			}
		});
	};
	
	update () {
		if (this.draggedCard && this.pointer) {
			const speed = 25;
			const maxVelocity = 1000;
			
			let vX = (this.pointer.x - this.draggedCard.x) * speed;
			let vY = (this.pointer.y - this.draggedCard.y) * speed;
			
			vX = Phaser.Math.Clamp(vX, -maxVelocity, maxVelocity);
			vY = Phaser.Math.Clamp(vY, -maxVelocity, maxVelocity);
			
			this.draggedCard.body.setVelocity(vX, vY);
		}
	};
};

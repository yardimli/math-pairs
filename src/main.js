// MODIFIED: Import the new TutorialScene
import { TutorialScene } from './scenes/TutorialScene.js';
import { MatchGameScene } from './scenes/MatchGameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

export async function launchGame (gridSize, targetSum, floatMargin, floatSpeed) {
	const config = {
		type: Phaser.AUTO,
		width: window.innerWidth,
		height: window.innerHeight,
		backgroundColor: '#000000',
		scale: {
			mode: Phaser.Scale.RESIZE,
			autoCenter: Phaser.Scale.CENTER_BOTH
		},
		physics: {
			default: 'arcade',
			arcade: {
				gravity: { y: 0 },
				debug: false
			}
		},
		// MODIFIED: Added TutorialScene to the beginning of the scene array.
		scene: [TutorialScene, MatchGameScene, GameOverScene]
	};
	
	const game = new Phaser.Game(config);
	
	// MODIFIED: Store new settings in registry
	game.registry.set('gridSize', gridSize);
	game.registry.set('targetSum', targetSum);
	game.registry.set('floatMargin', floatMargin); // NEW: Store float margin
	game.registry.set('floatSpeed', floatSpeed); // NEW: Store float speed
	
	return game;
};

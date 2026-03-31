import { MatchGameScene } from './scenes/MatchGameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// MODIFIED: launchGame now accepts gridSize and targetSum
export async function launchGame (gridSize, targetSum) {
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
		scene: [MatchGameScene, GameOverScene]
	};
	
	const game = new Phaser.Game(config);
	
	// MODIFIED: Store new settings in registry
	game.registry.set('gridSize', gridSize);
	game.registry.set('targetSum', targetSum);
	
	return game;
};

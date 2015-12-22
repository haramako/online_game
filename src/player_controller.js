/*******************************************************
 * プレイヤーの入力を処理するクラス.
 *******************************************************/
class PlayerController extends Phaser.Sprite {
	constructor(game, player){
		super(game, 0, 0, null);
		this.player = player;
		this.keys = game.input.keyboard.addKeys({
			'a': Phaser.KeyCode.Z,
			'b': Phaser.KeyCode.X,
			'up': Phaser.KeyCode.UP,
			'down': Phaser.KeyCode.DOWN,
			'left': Phaser.KeyCode.LEFT,
			'right': Phaser.KeyCode.RIGHT
		});

		game.add.existing(this);
	}
	update(){
		var p = this.player;
		if (this.keys.left.isDown){
			p.rotation -= 3 * this.game.time.physicsElapsed;
		}else if (this.keys.right.isDown){
			p.rotation += 3 * this.game.time.physicsElapsed;
		}
		if (this.keys.up.isDown){
			if( p.energy >= 1 ){
				p.vx += 100 * Math.sin(p.rotation) * this.game.time.physicsElapsed;
				p.vy -= 100 * Math.cos(p.rotation) * this.game.time.physicsElapsed;
				p.energy -= 10.0 * this.game.time.physicsElapsed;
			}
		}
		if (this.keys.a.isDown){
			if( p.reloadTime <= 0 && p.energy >= 1 ){
				p.makeBullet();
				p.reloadTime = 0.06;
				p.energy -= 1; 
			}
		}
		this.player.reloadTime -= this.game.time.physicsElapsed;
	}
}

module.exports = PlayerController;

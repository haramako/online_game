let SyncObject = require('./sync_object');

/*******************************************************
 * 弾
 *******************************************************/ 
class Bullet extends SyncObject {
	constructor(game, data){
		super(game, data);

		// 画像の指定
		this.setTexture(game.cache.getPixiTexture('bullet'));
		this.scale.setTo(0.25, 0.25);
		this.anchor.setTo(0.5, 0.5);
		
		// 物理演算
		//game.physics.p2.enable(bullet);
		// あたり判定
		//bullet.body.setRectangle(10, 20);
		// 向き
		//bullet.body.rotation = rotate;
		// 発射
		//bullet.body.thrust(15000);
	}
	update(){
		// this.rotation = rotation;
		this.speed = 200;
		this.vx = Math.sin(this.rotation) * this.speed;
		this.vy = -Math.cos(this.rotation) * this.speed;
		
		this.x += this.vx * this.game.time.physicsElapsed;
		this.y += this.vy * this.game.time.physicsElapsed;
	}
	sendData(){
		this.emit({x: this.x, y: this.y, rotation: this.rotation});
	}
}

 module.exports = Bullet;

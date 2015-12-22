let SyncObject = require('./sync_object');
let Bullet = require('./bullet');

/*******************************************************
 * プレイヤー/敵のロケット.
 *******************************************************/
class Rocket extends SyncObject {
	constructor(game, data){
		super(game, data);

		this.energy = 100;
		this.maxEnergy = 100;
		this.health = 100;
		this.maxHealth = 100;
		this.vx = 0;
		this.vy = 0;
		this.reloadTime = 0;

		this.setTexture(game.cache.getPixiTexture('player'));
		this.scale.setTo(0.3, 0.3);
		this.anchor.setTo(0.5, 0.5);
		// this.body.setRectangle(20, 80);
		
		// タイマー処理の登録
		this.recovertyTimer = game.time.events.loop(0.2 * Phaser.Timer.SECOND, this.onRecovery, this);
		this.networkTimer = game.time.events.loop(0.2 * Phaser.Timer.SECOND, this.onNetwork, this);
	}
	update(){
		this.x += this.vx * this.game.time.physicsElapsed;
		this.y += this.vy * this.game.time.physicsElapsed;
	}
	onRecovery(){
		// Energyの回復
		if(this.energy < this.maxEnergy){
			this.energy++;
		}
		if(this.health < this.game.player.maxHealth){
			this.game.player.health += 0.2;
		}
	}
	onNetwork(){
		if( this.isOwn() ){
			this.emit({x: this.x, y: this.y, vx: this.vx, vy: this.vy, rotation: this.rotation, energy: this.energy, health: this.health});
		}
	}
	receiveData(data){
		SyncObject.prototype.receiveData.call(this, data);
	}
	makeBullet(){
		var x = this.x + Math.sin(this.rotation) * 40;
		var y = this.y - Math.cos(this.rotation) * 40;
		var bullet = new Bullet(this.game, {x: x, y: y, rotation: this.rotation});
		bullet.sendData();
		return bullet;
	}

}

module.exports = Rocket;

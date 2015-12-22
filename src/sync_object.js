/*******************************************************
 * ネットワークで同期されるオブジェクト
 *******************************************************/
class SyncObject extends Phaser.Sprite {
	constructor(game, data){
		super(game, 0, 0, null);
		if( data.id ){
			this.id = ''+data.id;
		}else{
			this.id = ''+Math.floor(Math.random()*1000000);
			this.ownerId = game.networking.playerId;
		}
		this.initializeData(data);
		game.add.existing(this);
	}
	initializeData(data){
		this.receiveData(data);
	}
	emit(data){
		data.className = this.className;
		data.id = this.id;
		this.game.networking.socket.emit('C2S_Update', data);
	}
	sendData(data){
	}
	receiveData(data){
		for( var key in data ){
			if( data.hasOwnProperty(key) ){
				this[key] = data[key];
			}
		}
	}
	onDelete(data){
		this.destroy();
	}
	onReceiveData(data){
		// DO NOTHING
	}
	isOwn(){
		return (this.ownerId == this.game.networking.playerId);
	}
}

module.exports = SyncObject;


/*******************************************************
 * 通信処理を行うオブジェクト
 *******************************************************/
class Networking extends Phaser.Sprite {
	constructor(game, url, playerId){
		super(game, 0, 0, null);

		this.playerId = playerId;
		this.socket = io.connect(url);
		this.objects = {};
		
		// サーバからデータを受け取る
		this.socket.on("S2C_Start", (data)=>{
			for( var i = 0; i< data.objectList.length; i++){
				this.updateObject(data.objectList[i]);
			}
			this.socket.emit("C2S_Start", playerId);
			this.onInitialize();
		});

		// サーバからデータを受け取り更新
		this.socket.on("S2C_Update", (data)=> {
			this.updateObject(data);
		});

		// サーバからデータを受け取り更新
		this.socket.on("S2C_Delete", (id)=>{
			this.deleteObject(id);
		});

		this.socket.on("disconnect", (data)=>{
			console.log('disconnected');
		});
	}
	update(){
	}
	updateObject(data){
		if( this.objects[data.id] ){
			this.objects[data.id].receiveData(data);
		}else{
			this.objects[data.id] = this.createObject(data);
		}
	}
	createObject(data){
		// console.log('create object: '+data.id);
		var cls = Networking.networkingClasses[data.className];
		var newObject = new cls(this.game, data);
		return newObject;
	}
	deleteObject(id){
		// console.log('delete object: '+id);
		if( this.objects[id] ){
			this.objects[id].onDelete();
			delete this.objects[id];
		}
	}
	onInitialize(){
	}
}
Networking.networkingClasses = {};

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

exports.Networking = Networking;
exports.SyncObject = SyncObject;

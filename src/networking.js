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

module.exports = Networking;

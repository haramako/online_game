(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var net = require('./networking');

var Networking = net.Networking;
var SyncObject = net.SyncObject;

function init() {
	var energy_bar, hp_bar;
	var ANGLE = 200;
	var BOOST_POWER = 5000;
	var USE_ENERGY = 20;

	var puts = function puts() {
		console.log.apply(console, arguments);
	};

	// === ゲームに関する処理 ===
	var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preloadGame, create: createGame, update: updateGame });

	// 素材読み込み
	function preloadGame() {
		game.load.image('enemy', 'asset/enemy.png');
		game.load.image('player', 'asset/player.png');
		game.load.image('bullet', 'asset/bullet.png');
	}

	// Gameの初期化
	function createGame() {
		game.time.desiredFps = 15; // 15FPSに指定
		game.stage.disableVisibilityChange = true;
		// game.physics.startSystem(Phaser.Physics.P2JS);

		// ネットワークの初期化
		var url = "http://" + window.location.hostname + ":8080";
		var playerId = Math.floor(Math.random() * 10000);
		game.networking = new Networking(game, url, playerId);
		game.networking.onInitialize = function () {
			// playerの設定
			game.player = new Rocket(game, { x: Math.floor(Math.random() * 800 + 20), y: Math.floor(Math.random() * 600 + 20), rotation: 0 });
			game.controller = new PlayerController(game, this.game.player);
			game.hud = new PlayerHud(game, this.game.player);
		};
	}

	// Gameの更新処理
	function updateGame() {}
};

function CreateClass(className, superClass, cls) {
	var constructor = function constructor() {
		cls.constructor.apply(this, arguments);
	};
	constructor.prototype = Object.create(superClass.prototype, {});
	constructor.prototype.className = className;
	constructor.prototype.super = superClass.prototype;
	for (var key in cls) {
		if (cls.hasOwnProperty(key)) {
			constructor.prototype[key] = cls[key];
		}
	}
	return constructor;
}

/*******************************************************
 * プレイヤー/敵のロケット.
 *******************************************************/
var Rocket = CreateClass('Rocket', SyncObject, {
	constructor: function constructor(game, data) {
		SyncObject.call(this, game, data);

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
	},
	update: function update() {
		this.x += this.vx * this.game.time.physicsElapsed;
		this.y += this.vy * this.game.time.physicsElapsed;
	},
	onRecovery: function onRecovery() {
		// Energyの回復
		if (this.energy < this.maxEnergy) {
			this.energy++;
		}
		if (this.health < this.game.player.maxHealth) {
			this.game.player.health += 0.2;
		}
	},
	onNetwork: function onNetwork() {
		if (this.isOwn()) {
			this.emit({ x: this.x, y: this.y, vx: this.vx, vy: this.vy, rotation: this.rotation, energy: this.energy, health: this.health });
		}
	},
	receiveData: function receiveData(data) {
		SyncObject.prototype.receiveData.call(this, data);
	},
	makeBullet: function makeBullet() {
		var x = this.x + Math.sin(this.rotation) * 40;
		var y = this.y - Math.cos(this.rotation) * 40;
		var bullet = new Bullet(this.game, { x: x, y: y, rotation: this.rotation });
		bullet.sendData();
		return bullet;
	}

});

/*******************************************************
 * 弾
 *******************************************************/
var Bullet = CreateClass('Bullet', SyncObject, {
	constructor: function constructor(game, data) {
		SyncObject.call(this, game, data);

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
	},
	update: function update() {
		// this.rotation = rotation;
		this.speed = 200;
		this.vx = Math.sin(this.rotation) * this.speed;
		this.vy = -Math.cos(this.rotation) * this.speed;

		this.x += this.vx * this.game.time.physicsElapsed;
		this.y += this.vy * this.game.time.physicsElapsed;
	},
	sendData: function sendData() {
		this.emit({ x: this.x, y: this.y, rotation: this.rotation });
	}
});

/*******************************************************
 * プレイヤーの入力を処理するクラス.
 *******************************************************/
var PlayerController = CreateClass('PlayerController', Phaser.Sprite, {
	constructor: function constructor(game, player) {
		Phaser.Sprite.call(this, game, 0, 0, null);
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
	},
	update: function update() {
		var p = this.player;
		if (this.keys.left.isDown) {
			p.rotation -= 3 * this.game.time.physicsElapsed;
		} else if (this.keys.right.isDown) {
			p.rotation += 3 * this.game.time.physicsElapsed;
		}
		if (this.keys.up.isDown) {
			if (p.energy >= 1) {
				p.vx += 100 * Math.sin(p.rotation) * this.game.time.physicsElapsed;
				p.vy -= 100 * Math.cos(p.rotation) * this.game.time.physicsElapsed;
				p.energy -= 10.0 * this.game.time.physicsElapsed;
			}
		}
		if (this.keys.a.isDown) {
			if (p.reloadTime <= 0 && p.energy >= 1) {
				p.makeBullet();
				p.reloadTime = 0.06;
				p.energy -= 1;
			}
		}
		this.player.reloadTime -= this.game.time.physicsElapsed;
	}
});

/*******************************************************
 * 画面上部のHPやエナジーの表示.
 *******************************************************/
var PlayerHud = CreateClass('PlayerHud', Phaser.Sprite, {
	constructor: function constructor(game, player) {
		Phaser.Sprite.call(this, game, 0, 0, null);

		this.player = player;

		// HPゲージ
		this.hpBarBg = game.add.graphics(50, 30).lineStyle(16, 0xff0000, 0.8).lineTo(this.game.player.maxHealth, 0);

		this.hpBar = game.add.graphics(50, 30);

		// powerゲージ
		this.energyBarBg = game.add.graphics(80, 52.5).lineStyle(16, 0xff0000, 0.8).lineTo(player.maxEnergy, 0);

		this.energyBar = game.add.graphics(80, 52.5);

		// テキスト
		this.text = game.add.text(20, 20, "HP: \n" + "Energy: ", { font: "16px Arial", fill: "#EEE" });

		game.add.existing(this);
	},
	update: function update() {
		this.energyBar.clear().moveTo(0, 0).lineStyle(16, 0x00ced1, 0.9).lineTo(this.player.energy, 0);
		this.hpBar.clear().moveTo(0, 0).lineStyle(16, 0x00ff00, 0.9).lineTo(this.player.health, 0);
	}
});

Networking.networkingClasses = {
	Rocket: Rocket,
	Bullet: Bullet
};

window.onload = init;

},{"./networking":2}],2:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*******************************************************
 * 通信処理を行うオブジェクト
 *******************************************************/

var Networking = (function (_Phaser$Sprite) {
	_inherits(Networking, _Phaser$Sprite);

	function Networking(game, url, playerId) {
		_classCallCheck(this, Networking);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Networking).call(this, game, 0, 0, null));

		_this.playerId = playerId;
		_this.socket = io.connect(url);
		_this.objects = {};

		// サーバからデータを受け取る
		_this.socket.on("S2C_Start", function (data) {
			for (var i = 0; i < data.objectList.length; i++) {
				_this.updateObject(data.objectList[i]);
			}
			_this.socket.emit("C2S_Start", playerId);
			_this.onInitialize();
		});

		// サーバからデータを受け取り更新
		_this.socket.on("S2C_Update", function (data) {
			_this.updateObject(data);
		});

		// サーバからデータを受け取り更新
		_this.socket.on("S2C_Delete", function (id) {
			_this.deleteObject(id);
		});

		_this.socket.on("disconnect", function (data) {
			console.log('disconnected');
		});
		return _this;
	}

	_createClass(Networking, [{
		key: "update",
		value: function update() {}
	}, {
		key: "updateObject",
		value: function updateObject(data) {
			if (this.objects[data.id]) {
				this.objects[data.id].receiveData(data);
			} else {
				this.objects[data.id] = this.createObject(data);
			}
		}
	}, {
		key: "createObject",
		value: function createObject(data) {
			// console.log('create object: '+data.id);
			var cls = Networking.networkingClasses[data.className];
			var newObject = new cls(this.game, data);
			return newObject;
		}
	}, {
		key: "deleteObject",
		value: function deleteObject(id) {
			// console.log('delete object: '+id);
			if (this.objects[id]) {
				this.objects[id].onDelete();
				delete this.objects[id];
			}
		}
	}, {
		key: "onInitialize",
		value: function onInitialize() {}
	}]);

	return Networking;
})(Phaser.Sprite);

Networking.networkingClasses = {};

/*******************************************************
 * ネットワークで同期されるオブジェクト
 *******************************************************/

var SyncObject = (function (_Phaser$Sprite2) {
	_inherits(SyncObject, _Phaser$Sprite2);

	function SyncObject(game, data) {
		_classCallCheck(this, SyncObject);

		var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(SyncObject).call(this, game, 0, 0, null));

		if (data.id) {
			_this2.id = '' + data.id;
		} else {
			_this2.id = '' + Math.floor(Math.random() * 1000000);
			_this2.ownerId = game.networking.playerId;
		}
		_this2.initializeData(data);
		game.add.existing(_this2);
		return _this2;
	}

	_createClass(SyncObject, [{
		key: "initializeData",
		value: function initializeData(data) {
			this.receiveData(data);
		}
	}, {
		key: "emit",
		value: function emit(data) {
			data.className = this.className;
			data.id = this.id;
			this.game.networking.socket.emit('C2S_Update', data);
		}
	}, {
		key: "sendData",
		value: function sendData(data) {}
	}, {
		key: "receiveData",
		value: function receiveData(data) {
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					this[key] = data[key];
				}
			}
		}
	}, {
		key: "onDelete",
		value: function onDelete(data) {
			this.destroy();
		}
	}, {
		key: "onReceiveData",
		value: function onReceiveData(data) {
			// DO NOTHING
		}
	}, {
		key: "isOwn",
		value: function isOwn() {
			return this.ownerId == this.game.networking.playerId;
		}
	}]);

	return SyncObject;
})(Phaser.Sprite);

exports.Networking = Networking;
exports.SyncObject = SyncObject;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL25ldHdvcmtpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxZQUFZLENBQUM7O0FBRWIsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztBQUVsQyxJQUFJLFVBQVUsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQ2hDLElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUM7O0FBRWhDLFNBQVMsSUFBSSxHQUFHO0FBQ2YsS0FBSSxVQUFVLEVBQUUsTUFBTSxDQUFDO0FBQ3ZCLEtBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNoQixLQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDdkIsS0FBSSxVQUFVLEdBQUcsRUFBRSxDQUFDOztBQUVwQixLQUFJLElBQUksR0FBRyxTQUFQLElBQUksR0FBYTtBQUFFLFNBQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztFQUFFOzs7QUFBQyxBQUdoRSxLQUFJLElBQUksR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLENBQUM7OztBQUFDLEFBR3hILFVBQVMsV0FBVyxHQUFJO0FBQ3ZCLE1BQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQzVDLE1BQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0FBQzlDLE1BQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxD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TSxDQUFDLFNBQVMsRUFBQztBQUMzQyxPQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDO0dBQy9CO0VBQ0Q7QUFDRCxVQUFTLEVBQUUscUJBQVU7QUFDcEIsTUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUU7QUFDakIsT0FBSSxDQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQztHQUMvSDtFQUNEO0FBQ0QsWUFBVyxFQUFFLHFCQUFTLElBQUksRUFBQztBQUMxQixZQUFVLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0VBQ2xEO0FBQ0QsV0FBVSxFQUFFLHNCQUFVO0FBQ3JCLE1BQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzlDLE1BQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzlDLE1BQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDO0FBQzFFLFFBQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNs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Ozs7O0FBQUMsQUFLSCxJQUFJLFNBQVMsR0FBRyxXQUFXLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdkQsWUFBVyxFQUFFLHFCQUFTLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDbEMsUUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUUzQyxNQUFJLENBQUMsTUFBTSxHQUFHLE1BQU07OztBQUFDLEFBR3JCLE1BQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUNyQyxTQUFTLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7QUFFekMsTUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDOzs7QUFBQyxBQUd2QyxNQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FDM0MsU0FBUyxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQzVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUUvQixNQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUM7OztBQUFDLEFBRzdDLE1BQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLEdBQUcsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJ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WEksVUFBVTs7aUNBWUEsSUFBSSxFQUFDO0FBQ25CLE9BQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDdkI7Ozt1QkFDSSxJQUFJLEVBQUM7QUFDVCxPQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDaEMsT0FBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQ2xCLE9BQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQ3JEOzs7MkJBQ1EsSUFBSSxFQUFDLEVBQ2I7Ozs4QkFDVyxJQUFJLEVBQUM7QUFDaEIsUUFBSyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUU7QUFDckIsUUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQzdCLFNBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDdEI7SUFDRDtHQUNEOzs7MkJBQ1EsSUFBSSxFQUFDO0FBQ2IsT0FBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0dBQ2Y7OztnQ0FDYSxJQUFJLEVBQUM7O0dBRWxCOzs7MEJBQ007QUFDTixVQUFRLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFFO0dBQ3ZEOzs7UUFyQ0ksVUFBVTtHQUFTLE1BQU0sQ0FBQyxNQUFNOztBQXdDdEMsT0FBTyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFDaEMsT0FBTyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbmV0ID0gcmVxdWlyZSgnLi9uZXR3b3JraW5nJyk7XG5cbmxldCBOZXR3b3JraW5nID0gbmV0Lk5ldHdvcmtpbmc7XG5sZXQgU3luY09iamVjdCA9IG5ldC5TeW5jT2JqZWN0O1xuXG5mdW5jdGlvbiBpbml0KCkge1xuXHR2YXIgZW5lcmd5X2JhciwgaHBfYmFyO1xuXHR2YXIgQU5HTEUgPSAyMDA7XG5cdHZhciBCT09TVF9QT1dFUiA9IDUwMDA7XHRcblx0dmFyIFVTRV9FTkVSR1kgPSAyMDtcblxuXHR2YXIgcHV0cyA9IGZ1bmN0aW9uKCl7IGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7IH07XG5cdFxuXHQvLyA9PT0g44Ky44O844Og44Gr6Zai44GZ44KL5Yem55CGID09PVxuXHR2YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg4MDAsIDYwMCwgUGhhc2VyLkFVVE8sICcnLCB7IHByZWxvYWQ6IHByZWxvYWRHYW1lLCBjcmVhdGU6IGNyZWF0ZUdhbWUsIHVwZGF0ZTogdXBkYXRlR2FtZSB9KTtcblxuXHQvLyDntKDmnZDoqq3jgb/ovrzjgb9cblx0ZnVuY3Rpb24gcHJlbG9hZEdhbWUgKCkge1xuXHRcdGdhbWUubG9hZC5pbWFnZSgnZW5lbXknLCAnYXNzZXQvZW5lbXkucG5nJyk7XG5cdFx0Z2FtZS5sb2FkLmltYWdlKCdwbGF5ZXInLCAnYXNzZXQvcGxheWVyLnBuZycpO1xuXHRcdGdhbWUubG9hZC5pbWFnZSgnYnVsbGV0JywgJ2Fzc2V0L2J1bGxldC5wbmcnKTtcblx0fVxuXG5cdC8vIEdhbWXjga7liJ3mnJ/ljJZcbiAgICBmdW5jdGlvbiBjcmVhdGVHYW1lICgpIHtcblx0XHRnYW1lLnRpbWUuZGVzaXJlZEZwcyA9IDE1OyAvLyAxNUZQU+OBq+aMh+WumlxuXHRcdGdhbWUuc3RhZ2UuZGlzYWJsZVZpc2liaWxpdHlDaGFuZ2UgPSB0cnVlO1xuXHRcdC8vIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5QMkpTKTtcblx0XHRcblx0XHQvLyDjg43jg4Pjg4jjg6/jg7zjgq/jga7liJ3mnJ/ljJZcblx0XHR2YXIgdXJsID0gXCJodHRwOi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyBcIjo4MDgwXCI7XG5cdFx0dmFyIHBsYXllcklkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwMDAwKTtcblx0XHRnYW1lLm5ldHdvcmtpbmcgPSBuZXcgTmV0d29ya2luZyhnYW1lLCB1cmwsIHBsYXllcklkKTtcblx0XHRnYW1lLm5ldHdvcmtpbmcub25Jbml0aWFsaXplID0gZnVuY3Rpb24oKXtcblx0XHRcdC8vIHBsYXllcuOBruioreWumlxuXHRcdFx0Z2FtZS5wbGF5ZXIgPSBuZXcgUm9ja2V0KGdhbWUsIHt4OiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqODAwKzIwKSwgeTogTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjYwMCsyMCksIHJvdGF0aW9uOiAwfSk7XG5cdFx0XHRnYW1lLmNvbnRyb2xsZXIgPSBuZXcgUGxheWVyQ29udHJvbGxlcihnYW1lLCB0aGlzLmdhbWUucGxheWVyKTtcblx0XHRcdGdhbWUuaHVkID0gbmV3IFBsYXllckh1ZChnYW1lLCB0aGlzLmdhbWUucGxheWVyKTtcblx0XHR9O1xuXHR9XG5cblx0Ly8gR2FtZeOBruabtOaWsOWHpueQhlxuXHRmdW5jdGlvbiB1cGRhdGVHYW1lKCkge1xuXHR9XG5cbn07XG5cblx0ZnVuY3Rpb24gQ3JlYXRlQ2xhc3MoY2xhc3NOYW1lLCBzdXBlckNsYXNzLCBjbHMpe1xuXHRcdHZhciBjb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRjbHMuY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9O1xuXHRcdGNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcy5wcm90b3R5cGUsIHt9KTtcblx0XHRjb25zdHJ1Y3Rvci5wcm90b3R5cGUuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuXHRcdGNvbnN0cnVjdG9yLnByb3RvdHlwZS5zdXBlciA9IHN1cGVyQ2xhc3MucHJvdG90eXBlO1xuXHRcdGZvciggdmFyIGtleSBpbiBjbHMgKXtcblx0XHRcdGlmKCBjbHMuaGFzT3duUHJvcGVydHkoa2V5KSApe1xuXHRcdFx0XHRjb25zdHJ1Y3Rvci5wcm90b3R5cGVba2V5XSA9IGNsc1trZXldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gY29uc3RydWN0b3I7XG5cdH1cblx0XG5cdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAqIOODl+ODrOOCpOODpOODvC/mlbXjga7jg63jgrHjg4Pjg4guXG5cdCAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXHR2YXIgUm9ja2V0ID0gQ3JlYXRlQ2xhc3MoJ1JvY2tldCcsIFN5bmNPYmplY3QsIHtcblx0XHRjb25zdHJ1Y3RvcjogZnVuY3Rpb24oZ2FtZSwgZGF0YSl7XG5cdFx0XHRTeW5jT2JqZWN0LmNhbGwodGhpcywgZ2FtZSwgZGF0YSk7XG5cblx0XHRcdHRoaXMuZW5lcmd5ID0gMTAwO1xuXHRcdFx0dGhpcy5tYXhFbmVyZ3kgPSAxMDA7XG5cdFx0XHR0aGlzLmhlYWx0aCA9IDEwMDtcblx0XHRcdHRoaXMubWF4SGVhbHRoID0gMTAwO1xuXHRcdFx0dGhpcy52eCA9IDA7XG5cdFx0XHR0aGlzLnZ5ID0gMDtcblx0XHRcdHRoaXMucmVsb2FkVGltZSA9IDA7XG5cblx0XHRcdHRoaXMuc2V0VGV4dHVyZShnYW1lLmNhY2hlLmdldFBpeGlUZXh0dXJlKCdwbGF5ZXInKSk7XG5cdFx0XHR0aGlzLnNjYWxlLnNldFRvKDAuMywgMC4zKTtcblx0XHRcdHRoaXMuYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcblx0XHRcdC8vIHRoaXMuYm9keS5zZXRSZWN0YW5nbGUoMjAsIDgwKTtcblx0XHRcblx0XHRcdC8vIOOCv+OCpOODnuODvOWHpueQhuOBrueZu+mMslxuXHRcdFx0dGhpcy5yZWNvdmVydHlUaW1lciA9IGdhbWUudGltZS5ldmVudHMubG9vcCgwLjIgKiBQaGFzZXIuVGltZXIuU0VDT05ELCB0aGlzLm9uUmVjb3ZlcnksIHRoaXMpO1xuXHRcdFx0dGhpcy5uZXR3b3JrVGltZXIgPSBnYW1lLnRpbWUuZXZlbnRzLmxvb3AoMC4yICogUGhhc2VyLlRpbWVyLlNFQ09ORCwgdGhpcy5vbk5ldHdvcmssIHRoaXMpO1xuXHRcdH0sXG5cdFx0dXBkYXRlOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy54ICs9IHRoaXMudnggKiB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcblx0XHRcdHRoaXMueSArPSB0aGlzLnZ5ICogdGhpcy5nYW1lLnRpbWUucGh5c2ljc0VsYXBzZWQ7XG5cdFx0fSxcblx0XHRvblJlY292ZXJ5OiBmdW5jdGlvbigpe1xuXHRcdFx0Ly8gRW5lcmd544Gu5Zue5b6pXG5cdFx0XHRpZih0aGlzLmVuZXJneSA8IHRoaXMubWF4RW5lcmd5KXtcblx0XHRcdFx0dGhpcy5lbmVyZ3krKztcblx0XHRcdH1cblx0XHRcdGlmKHRoaXMuaGVhbHRoIDwgdGhpcy5nYW1lLnBsYXllci5tYXhIZWFsdGgpe1xuXHRcdFx0XHR0aGlzLmdhbWUucGxheWVyLmhlYWx0aCArPSAwLjI7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRvbk5ldHdvcms6IGZ1bmN0aW9uKCl7XG5cdFx0XHRpZiggdGhpcy5pc093bigpICl7XG5cdFx0XHRcdHRoaXMuZW1pdCh7eDogdGhpcy54LCB5OiB0aGlzLnksIHZ4OiB0aGlzLnZ4LCB2eTogdGhpcy52eSwgcm90YXRpb246IHRoaXMucm90YXRpb24sIGVuZXJneTogdGhpcy5lbmVyZ3ksIGhlYWx0aDogdGhpcy5oZWFsdGh9KTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlY2VpdmVEYXRhOiBmdW5jdGlvbihkYXRhKXtcblx0XHRcdFN5bmNPYmplY3QucHJvdG90eXBlLnJlY2VpdmVEYXRhLmNhbGwodGhpcywgZGF0YSk7XG5cdFx0fSxcblx0XHRtYWtlQnVsbGV0OiBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIHggPSB0aGlzLnggKyBNYXRoLnNpbih0aGlzLnJvdGF0aW9uKSAqIDQwO1xuXHRcdFx0dmFyIHkgPSB0aGlzLnkgLSBNYXRoLmNvcyh0aGlzLnJvdGF0aW9uKSAqIDQwO1xuXHRcdFx0dmFyIGJ1bGxldCA9IG5ldyBCdWxsZXQodGhpcy5nYW1lLCB7eDogeCwgeTogeSwgcm90YXRpb246IHRoaXMucm90YXRpb259KTtcblx0XHRcdGJ1bGxldC5zZW5kRGF0YSgpO1xuXHRcdFx0cmV0dXJuIGJ1bGxldDtcblx0XHR9XG5cblx0fSk7XG5cblx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICog5by+XG5cdCAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLyBcblx0dmFyIEJ1bGxldCA9IENyZWF0ZUNsYXNzKCdCdWxsZXQnLCBTeW5jT2JqZWN0LCB7XG5cdFx0Y29uc3RydWN0b3I6IGZ1bmN0aW9uKGdhbWUsIGRhdGEpe1xuXHRcdFx0U3luY09iamVjdC5jYWxsKHRoaXMsIGdhbWUsIGRhdGEpO1xuXG5cdFx0XHQvLyDnlLvlg4/jga7mjIflrppcblx0XHRcdHRoaXMuc2V0VGV4dHVyZShnYW1lLmNhY2hlLmdldFBpeGlUZXh0dXJlKCdidWxsZXQnKSk7XG5cdFx0XHR0aGlzLnNjYWxlLnNldFRvKDAuMjUsIDAuMjUpO1xuXHRcdFx0dGhpcy5hbmNob3Iuc2V0VG8oMC41LCAwLjUpO1xuXHRcdFx0XG5cdFx0XHQvLyDniannkIbmvJTnrpdcblx0XHRcdC8vZ2FtZS5waHlzaWNzLnAyLmVuYWJsZShidWxsZXQpO1xuXHRcdFx0Ly8g44GC44Gf44KK5Yik5a6aXG5cdFx0XHQvL2J1bGxldC5ib2R5LnNldFJlY3RhbmdsZSgxMCwgMjApO1xuXHRcdFx0Ly8g5ZCR44GNXG5cdFx0XHQvL2J1bGxldC5ib2R5LnJvdGF0aW9uID0gcm90YXRlO1xuXHRcdFx0Ly8g55m65bCEXG5cdFx0XHQvL2J1bGxldC5ib2R5LnRocnVzdCgxNTAwMCk7XG5cdFx0fSxcblx0XHR1cGRhdGU6IGZ1bmN0aW9uKCl7XG5cdFx0XHQvLyB0aGlzLnJvdGF0aW9uID0gcm90YXRpb247XG5cdFx0XHR0aGlzLnNwZWVkID0gMjAwO1xuXHRcdFx0dGhpcy52eCA9IE1hdGguc2luKHRoaXMucm90YXRpb24pICogdGhpcy5zcGVlZDtcblx0XHRcdHRoaXMudnkgPSAtTWF0aC5jb3ModGhpcy5yb3RhdGlvbikgKiB0aGlzLnNwZWVkO1xuXHRcdFx0XG5cdFx0XHR0aGlzLnggKz0gdGhpcy52eCAqIHRoaXMuZ2FtZS50aW1lLnBoeXNpY3NFbGFwc2VkO1xuXHRcdFx0dGhpcy55ICs9IHRoaXMudnkgKiB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcblx0XHR9LFxuXHRcdHNlbmREYXRhOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5lbWl0KHt4OiB0aGlzLngsIHk6IHRoaXMueSwgcm90YXRpb246IHRoaXMucm90YXRpb259KTtcblx0XHR9XG5cdH0pO1xuXG5cdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAqIOODl+ODrOOCpOODpOODvOOBruWFpeWKm+OCkuWHpueQhuOBmeOCi+OCr+ODqeOCuS5cblx0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cdHZhciBQbGF5ZXJDb250cm9sbGVyID0gQ3JlYXRlQ2xhc3MoJ1BsYXllckNvbnRyb2xsZXInLCBQaGFzZXIuU3ByaXRlLCB7XG5cdFx0Y29uc3RydWN0b3I6IGZ1bmN0aW9uKGdhbWUsIHBsYXllcil7XG5cdFx0XHRQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgMCwgMCwgbnVsbCk7XG5cdFx0XHR0aGlzLnBsYXllciA9IHBsYXllcjtcblx0XHRcdHRoaXMua2V5cyA9IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5cyh7XG5cdFx0XHRcdCdhJzogUGhhc2VyLktleUNvZGUuWixcblx0XHRcdFx0J2InOiBQaGFzZXIuS2V5Q29kZS5YLFxuXHRcdFx0XHQndXAnOiBQaGFzZXIuS2V5Q29kZS5VUCxcblx0XHRcdFx0J2Rvd24nOiBQaGFzZXIuS2V5Q29kZS5ET1dOLFxuXHRcdFx0XHQnbGVmdCc6IFBoYXNlci5LZXlDb2RlLkxFRlQsXG5cdFx0XHRcdCdyaWdodCc6IFBoYXNlci5LZXlDb2RlLlJJR0hUXG5cdFx0XHR9KTtcblxuXHRcdFx0Z2FtZS5hZGQuZXhpc3RpbmcodGhpcyk7XG5cdFx0fSxcblx0XHR1cGRhdGU6IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgcCA9IHRoaXMucGxheWVyO1xuXHRcdFx0aWYgKHRoaXMua2V5cy5sZWZ0LmlzRG93bil7XG5cdFx0XHRcdHAucm90YXRpb24gLT0gMyAqIHRoaXMuZ2FtZS50aW1lLnBoeXNpY3NFbGFwc2VkO1xuXHRcdFx0fWVsc2UgaWYgKHRoaXMua2V5cy5yaWdodC5pc0Rvd24pe1xuXHRcdFx0XHRwLnJvdGF0aW9uICs9IDMgKiB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLmtleXMudXAuaXNEb3duKXtcblx0XHRcdFx0aWYoIHAuZW5lcmd5ID49IDEgKXtcblx0XHRcdFx0XHRwLnZ4ICs9IDEwMCAqIE1hdGguc2luKHAucm90YXRpb24pICogdGhpcy5nYW1lLnRpbWUucGh5c2ljc0VsYXBzZWQ7XG5cdFx0XHRcdFx0cC52eSAtPSAxMDAgKiBNYXRoLmNvcyhwLnJvdGF0aW9uKSAqIHRoaXMuZ2FtZS50aW1lLnBoeXNpY3NFbGFwc2VkO1xuXHRcdFx0XHRcdHAuZW5lcmd5IC09IDEwLjAgKiB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMua2V5cy5hLmlzRG93bil7XG5cdFx0XHRcdGlmKCBwLnJlbG9hZFRpbWUgPD0gMCAmJiBwLmVuZXJneSA+PSAxICl7XG5cdFx0XHRcdFx0cC5tYWtlQnVsbGV0KCk7XG5cdFx0XHRcdFx0cC5yZWxvYWRUaW1lID0gMC4wNjtcblx0XHRcdFx0XHRwLmVuZXJneSAtPSAxOyBcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dGhpcy5wbGF5ZXIucmVsb2FkVGltZSAtPSB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcblx0XHR9XG5cdH0pO1xuXG5cdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAqIOeUu+mdouS4iumDqOOBrkhQ44KE44Ko44OK44K444O844Gu6KGo56S6LlxuXHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblx0dmFyIFBsYXllckh1ZCA9IENyZWF0ZUNsYXNzKCdQbGF5ZXJIdWQnLCBQaGFzZXIuU3ByaXRlLCB7XG5cdFx0Y29uc3RydWN0b3I6IGZ1bmN0aW9uKGdhbWUsIHBsYXllcil7XG5cdFx0XHRQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgMCwgMCwgbnVsbCk7XG5cdFx0XHRcblx0XHRcdHRoaXMucGxheWVyID0gcGxheWVyO1xuXHRcdFx0XG5cdFx0XHQvLyBIUOOCsuODvOOCuFxuXHRcdFx0dGhpcy5ocEJhckJnID0gZ2FtZS5hZGQuZ3JhcGhpY3MoNTAsIDMwKVxuXHRcdFx0XHRcdC5saW5lU3R5bGUoMTYsIDB4ZmYwMDAwLCAwLjgpXG5cdFx0XHRcdFx0LmxpbmVUbyh0aGlzLmdhbWUucGxheWVyLm1heEhlYWx0aCwgMCk7XG5cdFx0XHRcblx0XHRcdHRoaXMuaHBCYXIgPSBnYW1lLmFkZC5ncmFwaGljcyg1MCwgMzApO1xuXG5cdFx0XHQvLyBwb3dlcuOCsuODvOOCuFxuXHRcdFx0dGhpcy5lbmVyZ3lCYXJCZyA9IGdhbWUuYWRkLmdyYXBoaWNzKDgwLCA1Mi41KVxuXHRcdFx0XHRcdC5saW5lU3R5bGUoMTYsIDB4ZmYwMDAwLCAwLjgpXG5cdFx0XHRcdFx0LmxpbmVUbyhwbGF5ZXIubWF4RW5lcmd5LCAwKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5lbmVyZ3lCYXIgPSBnYW1lLmFkZC5ncmFwaGljcyg4MCwgNTIuNSk7XG5cdFx0XHRcblx0XHRcdC8vIOODhuOCreOCueODiFxuXHRcdFx0dGhpcy50ZXh0ID0gZ2FtZS5hZGQudGV4dCgyMCwgMjAsIFwiSFA6IFxcblwiICsgXCJFbmVyZ3k6IFwiLCB7IGZvbnQ6IFwiMTZweCBBcmlhbFwiLCBmaWxsOiBcIiNFRUVcIiB9KTtcblxuXG5cdFx0XHRnYW1lLmFkZC5leGlzdGluZyh0aGlzKTtcblx0XHR9LFxuXHRcdHVwZGF0ZTogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuZW5lcmd5QmFyLmNsZWFyKCkubW92ZVRvKDAsMCkubGluZVN0eWxlKDE2LCAweDAwY2VkMSwgMC45KS5saW5lVG8odGhpcy5wbGF5ZXIuZW5lcmd5LCAwKTtcblx0XHRcdHRoaXMuaHBCYXIuY2xlYXIoKS5tb3ZlVG8oMCwwKS5saW5lU3R5bGUoMTYsIDB4MDBmZjAwLCAwLjkpLmxpbmVUbyh0aGlzLnBsYXllci5oZWFsdGgsIDApO1xuXHRcdH1cblx0fSk7XG5cblxuXG5cbk5ldHdvcmtpbmcubmV0d29ya2luZ0NsYXNzZXMgPSB7XG5cdFJvY2tldDogUm9ja2V0LFxuXHRCdWxsZXQ6IEJ1bGxldFxufTtcblxud2luZG93Lm9ubG9hZCA9IGluaXQ7XG4iLCJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiDpgJrkv6Hlh6bnkIbjgpLooYzjgYbjgqrjg5bjgrjjgqfjgq/jg4hcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuY2xhc3MgTmV0d29ya2luZyBleHRlbmRzIFBoYXNlci5TcHJpdGUge1xuXHRjb25zdHJ1Y3RvcihnYW1lLCB1cmwsIHBsYXllcklkKXtcblx0XHRzdXBlcihnYW1lLCAwLCAwLCBudWxsKTtcblxuXHRcdHRoaXMucGxheWVySWQgPSBwbGF5ZXJJZDtcblx0XHR0aGlzLnNvY2tldCA9IGlvLmNvbm5lY3QodXJsKTtcblx0XHR0aGlzLm9iamVjdHMgPSB7fTtcblx0XHRcblx0XHQvLyDjgrXjg7zjg5DjgYvjgonjg4fjg7zjgr/jgpLlj5fjgZHlj5bjgotcblx0XHR0aGlzLnNvY2tldC5vbihcIlMyQ19TdGFydFwiLCAoZGF0YSk9Pntcblx0XHRcdGZvciggdmFyIGkgPSAwOyBpPCBkYXRhLm9iamVjdExpc3QubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHR0aGlzLnVwZGF0ZU9iamVjdChkYXRhLm9iamVjdExpc3RbaV0pO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5zb2NrZXQuZW1pdChcIkMyU19TdGFydFwiLCBwbGF5ZXJJZCk7XG5cdFx0XHR0aGlzLm9uSW5pdGlhbGl6ZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8g44K144O844OQ44GL44KJ44OH44O844K/44KS5Y+X44GR5Y+W44KK5pu05pawXG5cdFx0dGhpcy5zb2NrZXQub24oXCJTMkNfVXBkYXRlXCIsIChkYXRhKT0+IHtcblx0XHRcdHRoaXMudXBkYXRlT2JqZWN0KGRhdGEpO1xuXHRcdH0pO1xuXG5cdFx0Ly8g44K144O844OQ44GL44KJ44OH44O844K/44KS5Y+X44GR5Y+W44KK5pu05pawXG5cdFx0dGhpcy5zb2NrZXQub24oXCJTMkNfRGVsZXRlXCIsIChpZCk9Pntcblx0XHRcdHRoaXMuZGVsZXRlT2JqZWN0KGlkKTtcblx0XHR9KTtcblxuXHRcdHRoaXMuc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAoZGF0YSk9Pntcblx0XHRcdGNvbnNvbGUubG9nKCdkaXNjb25uZWN0ZWQnKTtcblx0XHR9KTtcblx0fVxuXHR1cGRhdGUoKXtcblx0fVxuXHR1cGRhdGVPYmplY3QoZGF0YSl7XG5cdFx0aWYoIHRoaXMub2JqZWN0c1tkYXRhLmlkXSApe1xuXHRcdFx0dGhpcy5vYmplY3RzW2RhdGEuaWRdLnJlY2VpdmVEYXRhKGRhdGEpO1xuXHRcdH1lbHNle1xuXHRcdFx0dGhpcy5vYmplY3RzW2RhdGEuaWRdID0gdGhpcy5jcmVhdGVPYmplY3QoZGF0YSk7XG5cdFx0fVxuXHR9XG5cdGNyZWF0ZU9iamVjdChkYXRhKXtcblx0XHQvLyBjb25zb2xlLmxvZygnY3JlYXRlIG9iamVjdDogJytkYXRhLmlkKTtcblx0XHR2YXIgY2xzID0gTmV0d29ya2luZy5uZXR3b3JraW5nQ2xhc3Nlc1tkYXRhLmNsYXNzTmFtZV07XG5cdFx0dmFyIG5ld09iamVjdCA9IG5ldyBjbHModGhpcy5nYW1lLCBkYXRhKTtcblx0XHRyZXR1cm4gbmV3T2JqZWN0O1xuXHR9XG5cdGRlbGV0ZU9iamVjdChpZCl7XG5cdFx0Ly8gY29uc29sZS5sb2coJ2RlbGV0ZSBvYmplY3Q6ICcraWQpO1xuXHRcdGlmKCB0aGlzLm9iamVjdHNbaWRdICl7XG5cdFx0XHR0aGlzLm9iamVjdHNbaWRdLm9uRGVsZXRlKCk7XG5cdFx0XHRkZWxldGUgdGhpcy5vYmplY3RzW2lkXTtcblx0XHR9XG5cdH1cblx0b25Jbml0aWFsaXplKCl7XG5cdH1cbn1cbk5ldHdvcmtpbmcubmV0d29ya2luZ0NsYXNzZXMgPSB7fTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIOODjeODg+ODiOODr+ODvOOCr+OBp+WQjOacn+OBleOCjOOCi+OCquODluOCuOOCp+OCr+ODiFxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5jbGFzcyBTeW5jT2JqZWN0IGV4dGVuZHMgUGhhc2VyLlNwcml0ZSB7XG5cdGNvbnN0cnVjdG9yKGdhbWUsIGRhdGEpe1xuXHRcdHN1cGVyKGdhbWUsIDAsIDAsIG51bGwpO1xuXHRcdGlmKCBkYXRhLmlkICl7XG5cdFx0XHR0aGlzLmlkID0gJycrZGF0YS5pZDtcblx0XHR9ZWxzZXtcblx0XHRcdHRoaXMuaWQgPSAnJytNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTAwMDAwMCk7XG5cdFx0XHR0aGlzLm93bmVySWQgPSBnYW1lLm5ldHdvcmtpbmcucGxheWVySWQ7XG5cdFx0fVxuXHRcdHRoaXMuaW5pdGlhbGl6ZURhdGEoZGF0YSk7XG5cdFx0Z2FtZS5hZGQuZXhpc3RpbmcodGhpcyk7XG5cdH1cblx0aW5pdGlhbGl6ZURhdGEoZGF0YSl7XG5cdFx0dGhpcy5yZWNlaXZlRGF0YShkYXRhKTtcblx0fVxuXHRlbWl0KGRhdGEpe1xuXHRcdGRhdGEuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWU7XG5cdFx0ZGF0YS5pZCA9IHRoaXMuaWQ7XG5cdFx0dGhpcy5nYW1lLm5ldHdvcmtpbmcuc29ja2V0LmVtaXQoJ0MyU19VcGRhdGUnLCBkYXRhKTtcblx0fVxuXHRzZW5kRGF0YShkYXRhKXtcblx0fVxuXHRyZWNlaXZlRGF0YShkYXRhKXtcblx0XHRmb3IoIHZhciBrZXkgaW4gZGF0YSApe1xuXHRcdFx0aWYoIGRhdGEuaGFzT3duUHJvcGVydHkoa2V5KSApe1xuXHRcdFx0XHR0aGlzW2tleV0gPSBkYXRhW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdG9uRGVsZXRlKGRhdGEpe1xuXHRcdHRoaXMuZGVzdHJveSgpO1xuXHR9XG5cdG9uUmVjZWl2ZURhdGEoZGF0YSl7XG5cdFx0Ly8gRE8gTk9USElOR1xuXHR9XG5cdGlzT3duKCl7XG5cdFx0cmV0dXJuICh0aGlzLm93bmVySWQgPT0gdGhpcy5nYW1lLm5ldHdvcmtpbmcucGxheWVySWQpO1xuXHR9XG59XG5cbmV4cG9ydHMuTmV0d29ya2luZyA9IE5ldHdvcmtpbmc7XG5leHBvcnRzLlN5bmNPYmplY3QgPSBTeW5jT2JqZWN0O1xuIl19

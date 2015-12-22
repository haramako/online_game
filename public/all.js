(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Networking = require('./networking');
var SyncObject = require('./sync_object');
var Rocket = require('./rocket');
var Bullet = require('./bullet');
var PlayerController = require('./player_controller');
var PlayerHud = require('./player_hud');

var puts = function puts() {
	console.log.apply(console, arguments);
};

var game;

function init() {

	// === ゲームに関する処理 ===
	game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preloadGame, create: createGame, update: updateGame });

	// 素材読み込み
	function preloadGame() {
		game.load.image('enemy', 'asset/enemy.png');
		game.load.image('player', 'asset/player.png');
		game.load.image('bullet', 'asset/bullet.png');
	}

	// Gameの初期化
	function createGame() {
		//game.time.desiredFps = 15; // 15FPSに指定
		game.time.desiredFps = 60; // 15FPSに指定
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
}

Networking.networkingClasses = {
	Rocket: Rocket,
	Bullet: Bullet
};

window.onload = init;

},{"./bullet":2,"./networking":3,"./player_controller":4,"./player_hud":5,"./rocket":6,"./sync_object":7}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SyncObject = require('./sync_object');

/*******************************************************
 * 弾
 *******************************************************/

var Bullet = (function (_SyncObject) {
	_inherits(Bullet, _SyncObject);

	function Bullet(game, data) {
		_classCallCheck(this, Bullet);

		// 画像の指定

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Bullet).call(this, game, data));

		_this.setTexture(game.cache.getPixiTexture('bullet'));
		_this.scale.setTo(0.25, 0.25);
		_this.anchor.setTo(0.5, 0.5);

		// 物理演算
		//game.physics.p2.enable(bullet);
		// あたり判定
		//bullet.body.setRectangle(10, 20);
		// 向き
		//bullet.body.rotation = rotate;
		// 発射
		//bullet.body.thrust(15000);
		return _this;
	}

	_createClass(Bullet, [{
		key: 'update',
		value: function update() {
			// this.rotation = rotation;
			this.speed = 200;
			this.vx = Math.sin(this.rotation) * this.speed;
			this.vy = -Math.cos(this.rotation) * this.speed;

			this.x += this.vx * this.game.time.physicsElapsed;
			this.y += this.vy * this.game.time.physicsElapsed;
		}
	}, {
		key: 'sendData',
		value: function sendData() {
			this.emit({ x: this.x, y: this.y, rotation: this.rotation });
		}
	}]);

	return Bullet;
})(SyncObject);

module.exports = Bullet;

},{"./sync_object":7}],3:[function(require,module,exports){
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

module.exports = Networking;

},{}],4:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*******************************************************
 * プレイヤーの入力を処理するクラス.
 *******************************************************/

var PlayerController = (function (_Phaser$Sprite) {
	_inherits(PlayerController, _Phaser$Sprite);

	function PlayerController(game, player) {
		_classCallCheck(this, PlayerController);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PlayerController).call(this, game, 0, 0, null));

		_this.player = player;
		_this.keys = game.input.keyboard.addKeys({
			'a': Phaser.KeyCode.Z,
			'b': Phaser.KeyCode.X,
			'up': Phaser.KeyCode.UP,
			'down': Phaser.KeyCode.DOWN,
			'left': Phaser.KeyCode.LEFT,
			'right': Phaser.KeyCode.RIGHT
		});

		game.add.existing(_this);
		return _this;
	}

	_createClass(PlayerController, [{
		key: 'update',
		value: function update() {
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
	}]);

	return PlayerController;
})(Phaser.Sprite);

module.exports = PlayerController;

},{}],5:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*******************************************************
 * 画面上部のHPやエナジーの表示.
 *******************************************************/

var PlayerHud = (function (_Phaser$Sprite) {
	_inherits(PlayerHud, _Phaser$Sprite);

	function PlayerHud(game, player) {
		_classCallCheck(this, PlayerHud);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PlayerHud).call(this, game, 0, 0, null));

		_this.player = player;

		// HPゲージ
		_this.hpBarBg = game.add.graphics(50, 30).lineStyle(16, 0xff0000, 0.8).lineTo(_this.game.player.maxHealth, 0);

		_this.hpBar = game.add.graphics(50, 30);

		// powerゲージ
		_this.energyBarBg = game.add.graphics(80, 52.5).lineStyle(16, 0xff0000, 0.8).lineTo(player.maxEnergy, 0);

		_this.energyBar = game.add.graphics(80, 52.5);

		// テキスト
		_this.text = game.add.text(20, 20, "HP: \n" + "Energy: ", { font: "16px Arial", fill: "#EEE" });

		game.add.existing(_this);
		return _this;
	}

	_createClass(PlayerHud, [{
		key: "update",
		value: function update() {
			this.energyBar.clear().moveTo(0, 0).lineStyle(16, 0x00ced1, 0.9).lineTo(this.player.energy, 0);
			this.hpBar.clear().moveTo(0, 0).lineStyle(16, 0x00ff00, 0.9).lineTo(this.player.health, 0);
		}
	}]);

	return PlayerHud;
})(Phaser.Sprite);

module.exports = PlayerHud;

},{}],6:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SyncObject = require('./sync_object');
var Bullet = require('./bullet');

/*******************************************************
 * プレイヤー/敵のロケット.
 *******************************************************/

var Rocket = (function (_SyncObject) {
	_inherits(Rocket, _SyncObject);

	function Rocket(game, data) {
		_classCallCheck(this, Rocket);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Rocket).call(this, game, data));

		_this.energy = 100;
		_this.maxEnergy = 100;
		_this.health = 100;
		_this.maxHealth = 100;
		_this.vx = 0;
		_this.vy = 0;
		_this.reloadTime = 0;

		_this.setTexture(game.cache.getPixiTexture('player'));
		_this.scale.setTo(0.3, 0.3);
		_this.anchor.setTo(0.5, 0.5);
		// this.body.setRectangle(20, 80);

		// タイマー処理の登録
		_this.recovertyTimer = game.time.events.loop(0.2 * Phaser.Timer.SECOND, _this.onRecovery, _this);
		_this.networkTimer = game.time.events.loop(0.2 * Phaser.Timer.SECOND, _this.onNetwork, _this);
		return _this;
	}

	_createClass(Rocket, [{
		key: 'update',
		value: function update() {
			this.x += this.vx * this.game.time.physicsElapsed;
			this.y += this.vy * this.game.time.physicsElapsed;
		}
	}, {
		key: 'onRecovery',
		value: function onRecovery() {
			// Energyの回復
			if (this.energy < this.maxEnergy) {
				this.energy++;
			}
			if (this.health < this.game.player.maxHealth) {
				this.game.player.health += 0.2;
			}
		}
	}, {
		key: 'onNetwork',
		value: function onNetwork() {
			if (this.isOwn()) {
				this.emit({ x: this.x, y: this.y, vx: this.vx, vy: this.vy, rotation: this.rotation, energy: this.energy, health: this.health });
			}
		}
	}, {
		key: 'receiveData',
		value: function receiveData(data) {
			SyncObject.prototype.receiveData.call(this, data);
		}
	}, {
		key: 'makeBullet',
		value: function makeBullet() {
			var x = this.x + Math.sin(this.rotation) * 40;
			var y = this.y - Math.cos(this.rotation) * 40;
			var bullet = new Bullet(this.game, { x: x, y: y, rotation: this.rotation });
			bullet.sendData();
			return bullet;
		}
	}]);

	return Rocket;
})(SyncObject);

module.exports = Rocket;

},{"./bullet":2,"./sync_object":7}],7:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*******************************************************
 * ネットワークで同期されるオブジェクト
 *******************************************************/

var SyncObject = (function (_Phaser$Sprite) {
	_inherits(SyncObject, _Phaser$Sprite);

	function SyncObject(game, data) {
		_classCallCheck(this, SyncObject);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SyncObject).call(this, game, 0, 0, null));

		if (data.id) {
			_this.id = '' + data.id;
		} else {
			_this.id = '' + Math.floor(Math.random() * 1000000);
			_this.ownerId = game.networking.playerId;
		}
		_this.initializeData(data);
		game.add.existing(_this);
		return _this;
	}

	_createClass(SyncObject, [{
		key: 'initializeData',
		value: function initializeData(data) {
			this.receiveData(data);
		}
	}, {
		key: 'emit',
		value: function emit(data) {
			data.className = this.className;
			data.id = this.id;
			this.game.networking.socket.emit('C2S_Update', data);
		}
	}, {
		key: 'sendData',
		value: function sendData(data) {}
	}, {
		key: 'receiveData',
		value: function receiveData(data) {
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					this[key] = data[key];
				}
			}
		}
	}, {
		key: 'onDelete',
		value: function onDelete(data) {
			this.destroy();
		}
	}, {
		key: 'onReceiveData',
		value: function onReceiveData(data) {
			// DO NOTHING
		}
	}, {
		key: 'isOwn',
		value: function isOwn() {
			return this.ownerId == this.game.networking.playerId;
		}
	}]);

	return SyncObject;
})(Phaser.Sprite);

module.exports = SyncObject;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL2J1bGxldC5qcyIsInNyYy9uZXR3b3JraW5nLmpzIiwic3JjL3BsYXllcl9jb250cm9sbGVyLmpzIiwic3JjL3BsYXllcl9odWQuanMiLCJzcmMvcm9ja2V0LmpzIiwic3JjL3N5bmNfb2JqZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsWUFBWSxDQUFDOztBQUViLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN6QyxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDMUMsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2pDLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqQyxJQUFJLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQ3RELElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQzs7QUFFeEMsSUFBSSxJQUFJLEdBQUcsU0FBUCxJQUFJLEdBQWE7QUFBRSxRQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7Q0FBRSxDQUFDOztBQUVoRSxJQUFJLElBQUksQ0FBQzs7QUFFVCxTQUFTLElBQUksR0FBRzs7O0FBR2YsS0FBSSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsQ0FBQzs7O0FBQUMsQUFHcEgsVUFBUyxXQUFXLEdBQUk7QUFDdkIsTUFBSSxDQUFD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QyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDdEI7SUFDRDtHQUNEOzs7MkJBQ1EsSUFBSSxFQUFDO0FBQ2IsT0FBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0dBQ2Y7OztnQ0FDYSxJQUFJLEVBQUM7O0dBRWxCOzs7MEJBQ007QUFDTixVQUFRLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFFO0dBQ3ZEOzs7UUFyQ0ksVUFBVTtHQUFTLE1BQU0sQ0FBQyxNQUFNOztBQXdDdEMsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5sZXQgTmV0d29ya2luZyA9IHJlcXVpcmUoJy4vbmV0d29ya2luZycpO1xubGV0IFN5bmNPYmplY3QgPSByZXF1aXJlKCcuL3N5bmNfb2JqZWN0Jyk7XG5sZXQgUm9ja2V0ID0gcmVxdWlyZSgnLi9yb2NrZXQnKTtcbmxldCBCdWxsZXQgPSByZXF1aXJlKCcuL2J1bGxldCcpO1xubGV0IFBsYXllckNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL3BsYXllcl9jb250cm9sbGVyJyk7XG5sZXQgUGxheWVySHVkID0gcmVxdWlyZSgnLi9wbGF5ZXJfaHVkJyk7XG5cbnZhciBwdXRzID0gZnVuY3Rpb24oKXsgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTsgfTtcblxudmFyIGdhbWU7XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG5cdFxuXHQvLyA9PT0g44Ky44O844Og44Gr6Zai44GZ44KL5Yem55CGID09PVxuXHRnYW1lID0gbmV3IFBoYXNlci5HYW1lKDgwMCwgNjAwLCBQaGFzZXIuQVVUTywgJycsIHsgcHJlbG9hZDogcHJlbG9hZEdhbWUsIGNyZWF0ZTogY3JlYXRlR2FtZSwgdXBkYXRlOiB1cGRhdGVHYW1lIH0pO1xuXG5cdC8vIOe0oOadkOiqreOBv+i+vOOBv1xuXHRmdW5jdGlvbiBwcmVsb2FkR2FtZSAoKSB7XG5cdFx0Z2FtZS5sb2FkLmltYWdlKCdlbmVteScsICdhc3NldC9lbmVteS5wbmcnKTtcblx0XHRnYW1lLmxvYWQuaW1hZ2UoJ3BsYXllcicsICdhc3NldC9wbGF5ZXIucG5nJyk7XG5cdFx0Z2FtZS5sb2FkLmltYWdlKCdidWxsZXQnLCAnYXNzZXQvYnVsbGV0LnBuZycpO1xuXHR9XG5cblx0Ly8gR2FtZeOBruWIneacn+WMllxuICAgIGZ1bmN0aW9uIGNyZWF0ZUdhbWUgKCkge1xuXHRcdC8vZ2FtZS50aW1lLmRlc2lyZWRGcHMgPSAxNTsgLy8gMTVGUFPjgavmjIflrppcblx0XHRnYW1lLnRpbWUuZGVzaXJlZEZwcyA9IDYwOyAvLyAxNUZQU+OBq+aMh+WumlxuXHRcdGdhbWUuc3RhZ2UuZGlzYWJsZVZpc2liaWxpdHlDaGFuZ2UgPSB0cnVlO1xuXHRcdC8vIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5QMkpTKTtcblx0XHRcblx0XHQvLyDjg43jg4Pjg4jjg6/jg7zjgq/jga7liJ3mnJ/ljJZcblx0XHR2YXIgdXJsID0gXCJodHRwOi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyBcIjo4MDgwXCI7XG5cdFx0dmFyIHBsYXllcklkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwMDAwKTtcblx0XHRnYW1lLm5ldHdvcmtpbmcgPSBuZXcgTmV0d29ya2luZyhnYW1lLCB1cmwsIHBsYXllcklkKTtcblx0XHRnYW1lLm5ldHdvcmtpbmcub25Jbml0aWFsaXplID0gZnVuY3Rpb24oKXtcblx0XHRcdC8vIHBsYXllcuOBruioreWumlxuXHRcdFx0Z2FtZS5wbGF5ZXIgPSBuZXcgUm9ja2V0KGdhbWUsIHt4OiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqODAwKzIwKSwgeTogTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjYwMCsyMCksIHJvdGF0aW9uOiAwfSk7XG5cdFx0XHRnYW1lLmNvbnRyb2xsZXIgPSBuZXcgUGxheWVyQ29udHJvbGxlcihnYW1lLCB0aGlzLmdhbWUucGxheWVyKTtcblx0XHRcdGdhbWUuaHVkID0gbmV3IFBsYXllckh1ZChnYW1lLCB0aGlzLmdhbWUucGxheWVyKTtcblx0XHR9O1xuXHR9XG5cblx0Ly8gR2FtZeOBruabtOaWsOWHpueQhlxuXHRmdW5jdGlvbiB1cGRhdGVHYW1lKCkge1xuXHR9XG59XG5cbk5ldHdvcmtpbmcubmV0d29ya2luZ0NsYXNzZXMgPSB7XG5cdFJvY2tldDogUm9ja2V0LFxuXHRCdWxsZXQ6IEJ1bGxldFxufTtcblxud2luZG93Lm9ubG9hZCA9IGluaXQ7XG4iLCJsZXQgU3luY09iamVjdCA9IHJlcXVpcmUoJy4vc3luY19vYmplY3QnKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIOW8vlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovIFxuY2xhc3MgQnVsbGV0IGV4dGVuZHMgU3luY09iamVjdCB7XG5cdGNvbnN0cnVjdG9yKGdhbWUsIGRhdGEpe1xuXHRcdHN1cGVyKGdhbWUsIGRhdGEpO1xuXG5cdFx0Ly8g55S75YOP44Gu5oyH5a6aXG5cdFx0dGhpcy5zZXRUZXh0dXJlKGdhbWUuY2FjaGUuZ2V0UGl4aVRleHR1cmUoJ2J1bGxldCcpKTtcblx0XHR0aGlzLnNjYWxlLnNldFRvKDAuMjUsIDAuMjUpO1xuXHRcdHRoaXMuYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcblx0XHRcblx0XHQvLyDniannkIbmvJTnrpdcblx0XHQvL2dhbWUucGh5c2ljcy5wMi5lbmFibGUoYnVsbGV0KTtcblx0XHQvLyDjgYLjgZ/jgorliKTlrppcblx0XHQvL2J1bGxldC5ib2R5LnNldFJlY3RhbmdsZSgxMCwgMjApO1xuXHRcdC8vIOWQkeOBjVxuXHRcdC8vYnVsbGV0LmJvZHkucm90YXRpb24gPSByb3RhdGU7XG5cdFx0Ly8g55m65bCEXG5cdFx0Ly9idWxsZXQuYm9keS50aHJ1c3QoMTUwMDApO1xuXHR9XG5cdHVwZGF0ZSgpe1xuXHRcdC8vIHRoaXMucm90YXRpb24gPSByb3RhdGlvbjtcblx0XHR0aGlzLnNwZWVkID0gMjAwO1xuXHRcdHRoaXMudnggPSBNYXRoLnNpbih0aGlzLnJvdGF0aW9uKSAqIHRoaXMuc3BlZWQ7XG5cdFx0dGhpcy52eSA9IC1NYXRoLmNvcyh0aGlzLnJvdGF0aW9uKSAqIHRoaXMuc3BlZWQ7XG5cdFx0XG5cdFx0dGhpcy54ICs9IHRoaXMudnggKiB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcblx0XHR0aGlzLnkgKz0gdGhpcy52eSAqIHRoaXMuZ2FtZS50aW1lLnBoeXNpY3NFbGFwc2VkO1xuXHR9XG5cdHNlbmREYXRhKCl7XG5cdFx0dGhpcy5lbWl0KHt4OiB0aGlzLngsIHk6IHRoaXMueSwgcm90YXRpb246IHRoaXMucm90YXRpb259KTtcblx0fVxufVxuXG4gbW9kdWxlLmV4cG9ydHMgPSBCdWxsZXQ7XG4iLCIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICog6YCa5L+h5Yem55CG44KS6KGM44GG44Kq44OW44K444Kn44Kv44OIXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmNsYXNzIE5ldHdvcmtpbmcgZXh0ZW5kcyBQaGFzZXIuU3ByaXRlIHtcblx0Y29uc3RydWN0b3IoZ2FtZSwgdXJsLCBwbGF5ZXJJZCl7XG5cdFx0c3VwZXIoZ2FtZSwgMCwgMCwgbnVsbCk7XG5cblx0XHR0aGlzLnBsYXllcklkID0gcGxheWVySWQ7XG5cdFx0dGhpcy5zb2NrZXQgPSBpby5jb25uZWN0KHVybCk7XG5cdFx0dGhpcy5vYmplY3RzID0ge307XG5cdFx0XG5cdFx0Ly8g44K144O844OQ44GL44KJ44OH44O844K/44KS5Y+X44GR5Y+W44KLXG5cdFx0dGhpcy5zb2NrZXQub24oXCJTMkNfU3RhcnRcIiwgKGRhdGEpPT57XG5cdFx0XHRmb3IoIHZhciBpID0gMDsgaTwgZGF0YS5vYmplY3RMaXN0Lmxlbmd0aDsgaSsrKXtcblx0XHRcdFx0dGhpcy51cGRhdGVPYmplY3QoZGF0YS5vYmplY3RMaXN0W2ldKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuc29ja2V0LmVtaXQoXCJDMlNfU3RhcnRcIiwgcGxheWVySWQpO1xuXHRcdFx0dGhpcy5vbkluaXRpYWxpemUoKTtcblx0XHR9KTtcblxuXHRcdC8vIOOCteODvOODkOOBi+OCieODh+ODvOOCv+OCkuWPl+OBkeWPluOCiuabtOaWsFxuXHRcdHRoaXMuc29ja2V0Lm9uKFwiUzJDX1VwZGF0ZVwiLCAoZGF0YSk9PiB7XG5cdFx0XHR0aGlzLnVwZGF0ZU9iamVjdChkYXRhKTtcblx0XHR9KTtcblxuXHRcdC8vIOOCteODvOODkOOBi+OCieODh+ODvOOCv+OCkuWPl+OBkeWPluOCiuabtOaWsFxuXHRcdHRoaXMuc29ja2V0Lm9uKFwiUzJDX0RlbGV0ZVwiLCAoaWQpPT57XG5cdFx0XHR0aGlzLmRlbGV0ZU9iamVjdChpZCk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLnNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKGRhdGEpPT57XG5cdFx0XHRjb25zb2xlLmxvZygnZGlzY29ubmVjdGVkJyk7XG5cdFx0fSk7XG5cdH1cblx0dXBkYXRlKCl7XG5cdH1cblx0dXBkYXRlT2JqZWN0KGRhdGEpe1xuXHRcdGlmKCB0aGlzLm9iamVjdHNbZGF0YS5pZF0gKXtcblx0XHRcdHRoaXMub2JqZWN0c1tkYXRhLmlkXS5yZWNlaXZlRGF0YShkYXRhKTtcblx0XHR9ZWxzZXtcblx0XHRcdHRoaXMub2JqZWN0c1tkYXRhLmlkXSA9IHRoaXMuY3JlYXRlT2JqZWN0KGRhdGEpO1xuXHRcdH1cblx0fVxuXHRjcmVhdGVPYmplY3QoZGF0YSl7XG5cdFx0Ly8gY29uc29sZS5sb2coJ2NyZWF0ZSBvYmplY3Q6ICcrZGF0YS5pZCk7XG5cdFx0dmFyIGNscyA9IE5ldHdvcmtpbmcubmV0d29ya2luZ0NsYXNzZXNbZGF0YS5jbGFzc05hbWVdO1xuXHRcdHZhciBuZXdPYmplY3QgPSBuZXcgY2xzKHRoaXMuZ2FtZSwgZGF0YSk7XG5cdFx0cmV0dXJuIG5ld09iamVjdDtcblx0fVxuXHRkZWxldGVPYmplY3QoaWQpe1xuXHRcdC8vIGNvbnNvbGUubG9nKCdkZWxldGUgb2JqZWN0OiAnK2lkKTtcblx0XHRpZiggdGhpcy5vYmplY3RzW2lkXSApe1xuXHRcdFx0dGhpcy5vYmplY3RzW2lkXS5vbkRlbGV0ZSgpO1xuXHRcdFx0ZGVsZXRlIHRoaXMub2JqZWN0c1tpZF07XG5cdFx0fVxuXHR9XG5cdG9uSW5pdGlhbGl6ZSgpe1xuXHR9XG59XG5OZXR3b3JraW5nLm5ldHdvcmtpbmdDbGFzc2VzID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gTmV0d29ya2luZztcbiIsIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiDjg5fjg6zjgqTjg6Tjg7zjga7lhaXlipvjgpLlh6bnkIbjgZnjgovjgq/jg6njgrkuXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmNsYXNzIFBsYXllckNvbnRyb2xsZXIgZXh0ZW5kcyBQaGFzZXIuU3ByaXRlIHtcblx0Y29uc3RydWN0b3IoZ2FtZSwgcGxheWVyKXtcblx0XHRzdXBlcihnYW1lLCAwLCAwLCBudWxsKTtcblx0XHR0aGlzLnBsYXllciA9IHBsYXllcjtcblx0XHR0aGlzLmtleXMgPSBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleXMoe1xuXHRcdFx0J2EnOiBQaGFzZXIuS2V5Q29kZS5aLFxuXHRcdFx0J2InOiBQaGFzZXIuS2V5Q29kZS5YLFxuXHRcdFx0J3VwJzogUGhhc2VyLktleUNvZGUuVVAsXG5cdFx0XHQnZG93bic6IFBoYXNlci5LZXlDb2RlLkRPV04sXG5cdFx0XHQnbGVmdCc6IFBoYXNlci5LZXlDb2RlLkxFRlQsXG5cdFx0XHQncmlnaHQnOiBQaGFzZXIuS2V5Q29kZS5SSUdIVFxuXHRcdH0pO1xuXG5cdFx0Z2FtZS5hZGQuZXhpc3RpbmcodGhpcyk7XG5cdH1cblx0dXBkYXRlKCl7XG5cdFx0dmFyIHAgPSB0aGlzLnBsYXllcjtcblx0XHRpZiAodGhpcy5rZXlzLmxlZnQuaXNEb3duKXtcblx0XHRcdHAucm90YXRpb24gLT0gMyAqIHRoaXMuZ2FtZS50aW1lLnBoeXNpY3NFbGFwc2VkO1xuXHRcdH1lbHNlIGlmICh0aGlzLmtleXMucmlnaHQuaXNEb3duKXtcblx0XHRcdHAucm90YXRpb24gKz0gMyAqIHRoaXMuZ2FtZS50aW1lLnBoeXNpY3NFbGFwc2VkO1xuXHRcdH1cblx0XHRpZiAodGhpcy5rZXlzLnVwLmlzRG93bil7XG5cdFx0XHRpZiggcC5lbmVyZ3kgPj0gMSApe1xuXHRcdFx0XHRwLnZ4ICs9IDEwMCAqIE1hdGguc2luKHAucm90YXRpb24pICogdGhpcy5nYW1lLnRpbWUucGh5c2ljc0VsYXBzZWQ7XG5cdFx0XHRcdHAudnkgLT0gMTAwICogTWF0aC5jb3MocC5yb3RhdGlvbikgKiB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcblx0XHRcdFx0cC5lbmVyZ3kgLT0gMTAuMCAqIHRoaXMuZ2FtZS50aW1lLnBoeXNpY3NFbGFwc2VkO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAodGhpcy5rZXlzLmEuaXNEb3duKXtcblx0XHRcdGlmKCBwLnJlbG9hZFRpbWUgPD0gMCAmJiBwLmVuZXJneSA+PSAxICl7XG5cdFx0XHRcdHAubWFrZUJ1bGxldCgpO1xuXHRcdFx0XHRwLnJlbG9hZFRpbWUgPSAwLjA2O1xuXHRcdFx0XHRwLmVuZXJneSAtPSAxOyBcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5wbGF5ZXIucmVsb2FkVGltZSAtPSB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllckNvbnRyb2xsZXI7XG4iLCIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICog55S76Z2i5LiK6YOo44GuSFDjgoTjgqjjg4rjgrjjg7zjga7ooajnpLouXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmNsYXNzIFBsYXllckh1ZCBleHRlbmRzIFBoYXNlci5TcHJpdGUge1xuXHRjb25zdHJ1Y3RvcihnYW1lLCBwbGF5ZXIpe1xuXHRcdHN1cGVyKGdhbWUsIDAsIDAsIG51bGwpO1xuXHRcdFxuXHRcdHRoaXMucGxheWVyID0gcGxheWVyO1xuXHRcdFxuXHRcdC8vIEhQ44Ky44O844K4XG5cdFx0dGhpcy5ocEJhckJnID0gZ2FtZS5hZGQuZ3JhcGhpY3MoNTAsIDMwKVxuXHRcdFx0XHQubGluZVN0eWxlKDE2LCAweGZmMDAwMCwgMC44KVxuXHRcdFx0XHQubGluZVRvKHRoaXMuZ2FtZS5wbGF5ZXIubWF4SGVhbHRoLCAwKTtcblx0XHRcblx0XHR0aGlzLmhwQmFyID0gZ2FtZS5hZGQuZ3JhcGhpY3MoNTAsIDMwKTtcblxuXHRcdC8vIHBvd2Vy44Ky44O844K4XG5cdFx0dGhpcy5lbmVyZ3lCYXJCZyA9IGdhbWUuYWRkLmdyYXBoaWNzKDgwLCA1Mi41KVxuXHRcdFx0XHQubGluZVN0eWxlKDE2LCAweGZmMDAwMCwgMC44KVxuXHRcdFx0XHQubGluZVRvKHBsYXllci5tYXhFbmVyZ3ksIDApO1xuXHRcdFxuXHRcdHRoaXMuZW5lcmd5QmFyID0gZ2FtZS5hZGQuZ3JhcGhpY3MoODAsIDUyLjUpO1xuXHRcdFxuXHRcdC8vIOODhuOCreOCueODiFxuXHRcdHRoaXMudGV4dCA9IGdhbWUuYWRkLnRleHQoMjAsIDIwLCBcIkhQOiBcXG5cIiArIFwiRW5lcmd5OiBcIiwgeyBmb250OiBcIjE2cHggQXJpYWxcIiwgZmlsbDogXCIjRUVFXCIgfSk7XG5cblxuXHRcdGdhbWUuYWRkLmV4aXN0aW5nKHRoaXMpO1xuXHR9XG5cdHVwZGF0ZSgpe1xuXHRcdHRoaXMuZW5lcmd5QmFyLmNsZWFyKCkubW92ZVRvKDAsMCkubGluZVN0eWxlKDE2LCAweDAwY2VkMSwgMC45KS5saW5lVG8odGhpcy5wbGF5ZXIuZW5lcmd5LCAwKTtcblx0XHR0aGlzLmhwQmFyLmNsZWFyKCkubW92ZVRvKDAsMCkubGluZVN0eWxlKDE2LCAweDAwZmYwMCwgMC45KS5saW5lVG8odGhpcy5wbGF5ZXIuaGVhbHRoLCAwKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllckh1ZDtcbiIsImxldCBTeW5jT2JqZWN0ID0gcmVxdWlyZSgnLi9zeW5jX29iamVjdCcpO1xubGV0IEJ1bGxldCA9IHJlcXVpcmUoJy4vYnVsbGV0Jyk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiDjg5fjg6zjgqTjg6Tjg7wv5pW144Gu44Ot44Kx44OD44OILlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5jbGFzcyBSb2NrZXQgZXh0ZW5kcyBTeW5jT2JqZWN0IHtcblx0Y29uc3RydWN0b3IoZ2FtZSwgZGF0YSl7XG5cdFx0c3VwZXIoZ2FtZSwgZGF0YSk7XG5cblx0XHR0aGlzLmVuZXJneSA9IDEwMDtcblx0XHR0aGlzLm1heEVuZXJneSA9IDEwMDtcblx0XHR0aGlzLmhlYWx0aCA9IDEwMDtcblx0XHR0aGlzLm1heEhlYWx0aCA9IDEwMDtcblx0XHR0aGlzLnZ4ID0gMDtcblx0XHR0aGlzLnZ5ID0gMDtcblx0XHR0aGlzLnJlbG9hZFRpbWUgPSAwO1xuXG5cdFx0dGhpcy5zZXRUZXh0dXJlKGdhbWUuY2FjaGUuZ2V0UGl4aVRleHR1cmUoJ3BsYXllcicpKTtcblx0XHR0aGlzLnNjYWxlLnNldFRvKDAuMywgMC4zKTtcblx0XHR0aGlzLmFuY2hvci5zZXRUbygwLjUsIDAuNSk7XG5cdFx0Ly8gdGhpcy5ib2R5LnNldFJlY3RhbmdsZSgyMCwgODApO1xuXHRcdFxuXHRcdC8vIOOCv+OCpOODnuODvOWHpueQhuOBrueZu+mMslxuXHRcdHRoaXMucmVjb3ZlcnR5VGltZXIgPSBnYW1lLnRpbWUuZXZlbnRzLmxvb3AoMC4yICogUGhhc2VyLlRpbWVyLlNFQ09ORCwgdGhpcy5vblJlY292ZXJ5LCB0aGlzKTtcblx0XHR0aGlzLm5ldHdvcmtUaW1lciA9IGdhbWUudGltZS5ldmVudHMubG9vcCgwLjIgKiBQaGFzZXIuVGltZXIuU0VDT05ELCB0aGlzLm9uTmV0d29yaywgdGhpcyk7XG5cdH1cblx0dXBkYXRlKCl7XG5cdFx0dGhpcy54ICs9IHRoaXMudnggKiB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcblx0XHR0aGlzLnkgKz0gdGhpcy52eSAqIHRoaXMuZ2FtZS50aW1lLnBoeXNpY3NFbGFwc2VkO1xuXHR9XG5cdG9uUmVjb3ZlcnkoKXtcblx0XHQvLyBFbmVyZ3njga7lm57lvqlcblx0XHRpZih0aGlzLmVuZXJneSA8IHRoaXMubWF4RW5lcmd5KXtcblx0XHRcdHRoaXMuZW5lcmd5Kys7XG5cdFx0fVxuXHRcdGlmKHRoaXMuaGVhbHRoIDwgdGhpcy5nYW1lLnBsYXllci5tYXhIZWFsdGgpe1xuXHRcdFx0dGhpcy5nYW1lLnBsYXllci5oZWFsdGggKz0gMC4yO1xuXHRcdH1cblx0fVxuXHRvbk5ldHdvcmsoKXtcblx0XHRpZiggdGhpcy5pc093bigpICl7XG5cdFx0XHR0aGlzLmVtaXQoe3g6IHRoaXMueCwgeTogdGhpcy55LCB2eDogdGhpcy52eCwgdnk6IHRoaXMudnksIHJvdGF0aW9uOiB0aGlzLnJvdGF0aW9uLCBlbmVyZ3k6IHRoaXMuZW5lcmd5LCBoZWFsdGg6IHRoaXMuaGVhbHRofSk7XG5cdFx0fVxuXHR9XG5cdHJlY2VpdmVEYXRhKGRhdGEpe1xuXHRcdFN5bmNPYmplY3QucHJvdG90eXBlLnJlY2VpdmVEYXRhLmNhbGwodGhpcywgZGF0YSk7XG5cdH1cblx0bWFrZUJ1bGxldCgpe1xuXHRcdHZhciB4ID0gdGhpcy54ICsgTWF0aC5zaW4odGhpcy5yb3RhdGlvbikgKiA0MDtcblx0XHR2YXIgeSA9IHRoaXMueSAtIE1hdGguY29zKHRoaXMucm90YXRpb24pICogNDA7XG5cdFx0dmFyIGJ1bGxldCA9IG5ldyBCdWxsZXQodGhpcy5nYW1lLCB7eDogeCwgeTogeSwgcm90YXRpb246IHRoaXMucm90YXRpb259KTtcblx0XHRidWxsZXQuc2VuZERhdGEoKTtcblx0XHRyZXR1cm4gYnVsbGV0O1xuXHR9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSb2NrZXQ7XG4iLCIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICog44ON44OD44OI44Ov44O844Kv44Gn5ZCM5pyf44GV44KM44KL44Kq44OW44K444Kn44Kv44OIXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmNsYXNzIFN5bmNPYmplY3QgZXh0ZW5kcyBQaGFzZXIuU3ByaXRlIHtcblx0Y29uc3RydWN0b3IoZ2FtZSwgZGF0YSl7XG5cdFx0c3VwZXIoZ2FtZSwgMCwgMCwgbnVsbCk7XG5cdFx0aWYoIGRhdGEuaWQgKXtcblx0XHRcdHRoaXMuaWQgPSAnJytkYXRhLmlkO1xuXHRcdH1lbHNle1xuXHRcdFx0dGhpcy5pZCA9ICcnK01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoxMDAwMDAwKTtcblx0XHRcdHRoaXMub3duZXJJZCA9IGdhbWUubmV0d29ya2luZy5wbGF5ZXJJZDtcblx0XHR9XG5cdFx0dGhpcy5pbml0aWFsaXplRGF0YShkYXRhKTtcblx0XHRnYW1lLmFkZC5leGlzdGluZyh0aGlzKTtcblx0fVxuXHRpbml0aWFsaXplRGF0YShkYXRhKXtcblx0XHR0aGlzLnJlY2VpdmVEYXRhKGRhdGEpO1xuXHR9XG5cdGVtaXQoZGF0YSl7XG5cdFx0ZGF0YS5jbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZTtcblx0XHRkYXRhLmlkID0gdGhpcy5pZDtcblx0XHR0aGlzLmdhbWUubmV0d29ya2luZy5zb2NrZXQuZW1pdCgnQzJTX1VwZGF0ZScsIGRhdGEpO1xuXHR9XG5cdHNlbmREYXRhKGRhdGEpe1xuXHR9XG5cdHJlY2VpdmVEYXRhKGRhdGEpe1xuXHRcdGZvciggdmFyIGtleSBpbiBkYXRhICl7XG5cdFx0XHRpZiggZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpICl7XG5cdFx0XHRcdHRoaXNba2V5XSA9IGRhdGFba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0b25EZWxldGUoZGF0YSl7XG5cdFx0dGhpcy5kZXN0cm95KCk7XG5cdH1cblx0b25SZWNlaXZlRGF0YShkYXRhKXtcblx0XHQvLyBETyBOT1RISU5HXG5cdH1cblx0aXNPd24oKXtcblx0XHRyZXR1cm4gKHRoaXMub3duZXJJZCA9PSB0aGlzLmdhbWUubmV0d29ya2luZy5wbGF5ZXJJZCk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTeW5jT2JqZWN0O1xuIl19

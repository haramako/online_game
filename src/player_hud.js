/*******************************************************
 * 画面上部のHPやエナジーの表示.
 *******************************************************/
class PlayerHud extends Phaser.Sprite {
	constructor(game, player){
		super(game, 0, 0, null);
		
		this.player = player;
		
		// HPゲージ
		this.hpBarBg = game.add.graphics(50, 30)
				.lineStyle(16, 0xff0000, 0.8)
				.lineTo(this.game.player.maxHealth, 0);
		
		this.hpBar = game.add.graphics(50, 30);

		// powerゲージ
		this.energyBarBg = game.add.graphics(80, 52.5)
				.lineStyle(16, 0xff0000, 0.8)
				.lineTo(player.maxEnergy, 0);
		
		this.energyBar = game.add.graphics(80, 52.5);
		
		// テキスト
		this.text = game.add.text(20, 20, "HP: \n" + "Energy: ", { font: "16px Arial", fill: "#EEE" });


		game.add.existing(this);
	}
	update(){
		this.energyBar.clear().moveTo(0,0).lineStyle(16, 0x00ced1, 0.9).lineTo(this.player.energy, 0);
		this.hpBar.clear().moveTo(0,0).lineStyle(16, 0x00ff00, 0.9).lineTo(this.player.health, 0);
	}
}

module.exports = PlayerHud;

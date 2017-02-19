ChubbyBunny.Preloader = function() {
	Phaser.State.call(this);
};

ChubbyBunny.Preloader.prototype = Object.create(Phaser.State.prototype);
ChubbyBunny.Preloader.prototype.constructor = ChubbyBunny.Preloader;

ChubbyBunny.Preloader.prototype.preload = function() {
	this.load.image('background', 'assets/imgs/background.png');
	this.load.image('floor', 'assets/imgs/floor.png');
	this.load.image('wall', 'assets/imgs/wall.png');

	this.load.spritesheet('love_meter', 'assets/imgs/love_meter.png', 16, 16);
	this.load.image('win', 'assets/imgs/win.png');
	this.load.image('lose', 'assets/imgs/lose.png');
	this.load.image('retry', 'assets/imgs/retry.png');

	this.load.spritesheet('bunny', 'assets/imgs/bunny.png', 32, 32);

	this.load.image('fox_body_bg', 'assets/imgs/fox_body_bg.png');
	this.load.image('fox_body_fg', 'assets/imgs/fox_body_fg.png');
	this.load.image('fox_head_bg', 'assets/imgs/fox_head_bg.png');
	this.load.spritesheet('fox_head_fg', 'assets/imgs/fox_head_fg.png', 99,  40);

	this.load.audio('poof', 'assets/sfxs/poof.ogg');
	this.load.audio('pick_up', 'assets/sfxs/pick_up.ogg');
	this.load.audio('throw', 'assets/sfxs/throw.ogg');
	this.load.audio('death', 'assets/sfxs/death.ogg');
	this.load.audio('music', 'assets/mp3s/Kick Shock.mp3?v=2');
};

ChubbyBunny.Preloader.prototype.update = function() {
	if (this.cache.isSoundDecoded('music')) {
		this.state.start('Game');
	}
};
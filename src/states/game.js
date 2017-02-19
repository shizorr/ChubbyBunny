ChubbyBunny.Game = function() {
	Phaser.State.call(this);

	this._loveMeter = null;
};

ChubbyBunny.Game.prototype = Object.create(Phaser.State.prototype);
ChubbyBunny.Game.prototype.constructor = ChubbyBunny.Game;

ChubbyBunny.Game.HEALTH_METER_NUM_SPRITES = 10;
ChubbyBunny.Game.SPAWN_COUNT_MIN = 3;
ChubbyBunny.Game.SPAWN_COUNT_MAX = 5;
ChubbyBunny.Game.SPAWN_OFFSET_MIN = 10;
ChubbyBunny.Game.SPAWN_OFFSET_MAX = 40;
ChubbyBunny.Game.FOX_CHOKE_POINT_X = -140;
ChubbyBunny.Game.MIN_BUNNIES_TO_WIN = 16;

ChubbyBunny.Game.prototype.create = function() {
	var worldSize = new Phaser.Point(
		ChubbyBunny.WORLD_MAX.x - ChubbyBunny.WORLD_MIN.x,
		ChubbyBunny.WORLD_MAX.y - ChubbyBunny.WORLD_MIN.y);
	this.world.setBounds(
		ChubbyBunny.WORLD_MIN.x, ChubbyBunny.WORLD_MIN.y,
		worldSize.x, worldSize.y);

	// add environment sprites
	this.add.tileSprite(
		ChubbyBunny.WORLD_MIN.x, ChubbyBunny.WORLD_MIN.y,
		worldSize.x, worldSize.y,
		'background');
	this.add.tileSprite(
		ChubbyBunny.WORLD_MIN.x, ChubbyBunny.FLOOR_Y,
		worldSize.x, ChubbyBunny.FLOOR_HEIGHT, 'floor');
	this.add.tileSprite(
		ChubbyBunny.WORLD_MIN.x, ChubbyBunny.WORLD_MIN.y,
		ChubbyBunny.WALL_WIDTH, ChubbyBunny.FLOOR_Y, 'wall');

	// add hud
	var hud = this.add.group();
	hud.fixedToCamera = true;

	this._loveMeter = this.add.sprite(8, 8, 'love_meter', null, hud);

	var win = this.add.sprite(this.game.width / 2, 52, 'win', null, hud);
	win.anchor.setTo(.5, .5);
	win.scale.setTo(6, 6);
	this._win = win;

	var lose = this.add.sprite(this.game.width / 2, 52, 'lose', null, hud);
	lose.anchor.setTo(.5, .5);
	lose.scale.setTo(6, 6);
	this._lose = lose;

	var retry = this.add.sprite(this.game.width / 2, 128, 'retry', null, hud);
	retry.anchor.setTo(.5, .5);
	retry.scale.setTo(3, 3);
	this._retry = retry;

	this._fox = new ChubbyBunny.Fox(this);

	// add ai bunnies and player
	this._bunniesGroup = this.add.group();
	this._bunnies = new Array(100);
	for (var i = 0, len = this._bunnies.length; i < len; i++) {
		this._bunnies[i] = new ChubbyBunny.Bunny(this.game, this._bunniesGroup);
	}

	this._player = new ChubbyBunny.Player(this.game);
	this.camera.follow(this._player.sprite);

	this._fox.head.bringToTop();
	this._player.sprite.bringToTop();
	this.world.bringToTop(hud);

	this._sfxPoof = this.add.audio('poof', .7);
	this._sfxDeath = this.add.audio('death', .7);

	var music = this.add.audio('music', .4, true);
	music.play();

	this._reset();
};

ChubbyBunny.Game.prototype.update = function() {
	var pointer = this.input.activePointer;

	if (this._gameOver) {
		if (this._retry.visible) {
			if ((this._pointerPrevDown === true) && (pointer.isUp)) {
				this._reset();
			}
			this._pointerPrevDown = pointer.isDown;
		}
		else if (pointer.isUp) {
			this._retry.visible = true;
		}
		return;
	}

	var deltaTime, i, len;
	deltaTime = this.time.physicsElapsed;

	this._fox.update(deltaTime, 0);
	if ((this._fox.x <= ChubbyBunny.Game.FOX_CHOKE_POINT_X) &&
		(this._fox.numBunnies >= ChubbyBunny.Game.MIN_BUNNIES_TO_WIN)) {
		this._fox.choke();
		this._gameOver = true;
		this._win.visible = true;
		this._loveMeter.visible = false;
		return;
	}
	else if (this._fox.bunniesEaten) {
		for (i = 0, len = this._bunnies.length; i < len; i++) {
			this._bunnies[i].consume();
		}

		this._sfxDeath.play();
	}

	this._player.update(deltaTime, pointer);
	this._loveMeter.frame = Math.floor(this._player.love * (ChubbyBunny.Game.HEALTH_METER_NUM_SPRITES - 1));
	if (this._player.spawnBunnies) {
		var numBunnies = this.rnd.integerInRange(ChubbyBunny.Game.SPAWN_COUNT_MIN, ChubbyBunny.Game.SPAWN_COUNT_MAX);
		for (i = 0, len = this._bunnies.length; i < len; i++) {
			if (this._bunnies[i].isActive()) continue;
			var spawnPos = this._player.sprite.x +
				(Math.sign(this.rnd.normal()) * this.rnd.realInRange(ChubbyBunny.Game.SPAWN_OFFSET_MIN, ChubbyBunny.Game.SPAWN_OFFSET_MAX));
			this._bunnies[i].spawn(spawnPos);
			if (--numBunnies <= 0) break;
		}

		this._sfxPoof.play();
	}

	var tentativeTarget = null;
	for (i = 0, len = this._bunnies.length; i < len; i++) {
		var bunny = this._bunnies[i];
		if (!bunny.isActive()) continue;

		bunny.update(deltaTime, this._fox);

		if (pointer.isDown &&
			bunny.canBePicked() &&
			bunny.spriteContains(pointer.worldX, pointer.worldY)) {
			tentativeTarget = bunny;
		}
	}

	if (pointer.isDown) this._player.setTarget(tentativeTarget);
	if (this._player.sprite.x >= this._fox.x) {
		this._gameOver = true;
		this._lose.visible = true;
		this._loveMeter.visible = false;

		this._player.sprite.visible = false;
		this._fox.eatPlayer();

		this._sfxDeath.play();
	}
};

ChubbyBunny.Game.prototype.render = function() {
	this._bunnies[0].render();
};

ChubbyBunny.Game.prototype._reset = function() {
	this._gameOver = false;
	this._pointerPrevDown = null;
	this._win.visible = false;
	this._lose.visible = false;
	this._retry.visible = false;
	this._loveMeter.visible = true;

	this._fox.initialize();
	
	for (var i = 0, len = this._bunnies.length; i < len; i++) {
		this._bunnies[i].initialize();
	}
	this._bunnies[0].spawn(-32, true);

	this._player.sprite.visible = true;
	this._player.initialize();
};
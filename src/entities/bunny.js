ChubbyBunny.Bunny = function(state, group) {
	this._rnd = state.rnd;

	this._timer = 0;
	this._moveTo = 0;
	this._force = new Phaser.Point(0, 0);
	this._offset = 0;

	var sprite = state.add.sprite(0, 0, 'bunny', null, group);
	sprite.anchor.setTo(.5, 1);
	sprite.animations.add('idle', [0, 1, 2, 3, 4, 5], 12, true);
	sprite.animations.add('walk', [6, 7, 8, 9, 10, 11], 12, true);
	sprite.animations.add('kiss', [12, 13, 14, 15], 12, true);
	sprite.animations.add('born', [16, 17, 18, 19, 20, 21, 22, 23], 16, false);
	this.sprite = sprite;
};

ChubbyBunny.Bunny.STATES = {
		INACTIVE: -1,
		IDLE: 0,
		WALK: 1,
		WAIT: 2,
		KISS: 3,
		THROWN: 4,
		BORN: 5,
		IN_FOX_MOUTH: 6,
};
ChubbyBunny.Bunny.WALK_SPEED = 40;
ChubbyBunny.Bunny.IDLE_TIME_MIN = 2;
ChubbyBunny.Bunny.IDLE_TIME_MAX = 5;
ChubbyBunny.Bunny.MOVE_OFFSET_MIN = 50;
ChubbyBunny.Bunny.MOVE_OFFSET_MAX = 100;
ChubbyBunny.Bunny.PICK_WIDTH = 32;
ChubbyBunny.Bunny.THROWN_FORCE_X = 200;
ChubbyBunny.Bunny.THROWN_FORCE_Y = -100;

ChubbyBunny.Bunny.prototype.initialize = function() {
	this._state = ChubbyBunny.Bunny.STATES.INACTIVE;
	this.sprite.visible = false;
};

ChubbyBunny.Bunny.prototype.update = function(deltaTime, fox) {
	this._timer -= deltaTime;

	var deltaMov = this._moveTo - this.sprite.x;
	var dirMov = Math.sign(deltaMov);
	deltaMov = Math.abs(deltaMov);

	switch (this._state) {
		case ChubbyBunny.Bunny.STATES.IDLE:
			if (this._timer <= 0) {
				var moveOffset = Math.sign(this._rnd.normal()) * this._rnd.between(ChubbyBunny.Bunny.MOVE_OFFSET_MIN, ChubbyBunny.Bunny.MOVE_OFFSET_MAX);
				this._moveTo = this.sprite.x + moveOffset;
				this._setState(ChubbyBunny.Bunny.STATES.WALK);
			}
			break;
		case ChubbyBunny.Bunny.STATES.WALK:
			this.sprite.x += dirMov * deltaTime * ChubbyBunny.Bunny.WALK_SPEED;
			this.flipSpriteX(dirMov < 0);

			if (this.sprite.x < ChubbyBunny.BUNNY_MIN_X) {
				this._moveTo = this.sprite.x + (this.sprite.x - this._moveTo);
			}
			if (Math.abs(deltaMov) < 1) {
				this._setState(ChubbyBunny.Bunny.STATES.IDLE);
			}
			break;
		case ChubbyBunny.Bunny.STATES.THROWN:
			this.sprite.x += this._force.x * deltaTime;
			this.sprite.y += this._force.y * deltaTime;
			this._force.y += ChubbyBunny.GRAVITY * deltaTime;

			if (this.sprite.y >= ChubbyBunny.FLOOR_Y) {
				this.sprite.y = ChubbyBunny.FLOOR_Y;
				this._setState(ChubbyBunny.Bunny.STATES.IDLE);
			}
			break;
		case ChubbyBunny.Bunny.STATES.BORN:
			if (this.sprite.animations.currentAnim.isFinished) {
				this._setState(ChubbyBunny.Bunny.STATES.IDLE);
			}
			break;
		case ChubbyBunny.Bunny.STATES.IN_FOX_MOUTH:
			this.sprite.x = fox.x + this._offset;
			break;
	}

	if (this._state !== ChubbyBunny.Bunny.STATES.IN_FOX_MOUTH) {
		if (this.sprite.x < ChubbyBunny.BUNNY_MIN_X) {
			this.sprite.x = ChubbyBunny.BUNNY_MIN_X;
		}
		if (this.sprite.x > fox.x) {
			this._setState(ChubbyBunny.Bunny.STATES.IN_FOX_MOUTH);
			fox.addBunny();
		}
	}
};

ChubbyBunny.Bunny.prototype.render = function() {
	// var width = ChubbyBunny.Bunny.PICK_WIDTH;
	// var height = this.sprite.height;
	// var left = this.sprite.x - (width / 2);
	// var top = this.sprite.top;
	// var rect = new Phaser.Rectangle(left, top, width, height);
	// this._game.debug.geom(rect);
};

ChubbyBunny.Bunny.prototype.spawn = function(x, skipBirth) {
	this.sprite.x = x;
	this.sprite.y = ChubbyBunny.FLOOR_Y;
	this.flipSpriteX(this._rnd.between(0, 1) === 0);
	this.sprite.visible = true;

	if ((skipBirth === undefined) || (skipBirth === false)) {
		this._setState(ChubbyBunny.Bunny.STATES.BORN);
	}
	else {
		this.resume();
	}
};

ChubbyBunny.Bunny.prototype.isActive = function() {
	return this._state !== ChubbyBunny.Bunny.STATES.INACTIVE;
};

ChubbyBunny.Bunny.prototype.canBePicked = function() {
	return !((this._state === ChubbyBunny.Bunny.STATES.THROWN) ||
		(this._state === ChubbyBunny.Bunny.STATES.BORN)); 
};

ChubbyBunny.Bunny.prototype.spriteContains = function(x, y) {
	// note: due to sprite.input.pointerOver() behaving weird resorted to checking the bound contain myself
	var width = ChubbyBunny.Bunny.PICK_WIDTH;
	var height = this.sprite.height;
	var left = this.sprite.x - (width / 2);
	var top = this.sprite.top;
	var rect = new Phaser.Rectangle(left, top, width, height);
	return rect.contains(x, y);
};

ChubbyBunny.Bunny.prototype.wait = function() {
	this._setState(ChubbyBunny.Bunny.STATES.WAIT);
};

ChubbyBunny.Bunny.prototype.resume = function() {
	this._setState(ChubbyBunny.Bunny.STATES.IDLE);
};

ChubbyBunny.Bunny.prototype.kiss = function() {
	this._setState(ChubbyBunny.Bunny.STATES.KISS);
	this.sprite.bringToTop();
};

ChubbyBunny.Bunny.prototype.throw = function() {
	this._setState(ChubbyBunny.Bunny.STATES.THROWN);
};

ChubbyBunny.Bunny.prototype.consume = function() {
	if (this._state === ChubbyBunny.Bunny.STATES.IN_FOX_MOUTH) {
		this.initialize();
	}
};

ChubbyBunny.Bunny.prototype.flipSpriteX = function(flip) {
	this.sprite.scale.x = (flip ? -1 : 1) * Math.abs(this.sprite.scale.x);
};

ChubbyBunny.Bunny.prototype._setState = function(state) {
	this._state = state;
	switch (this._state) {
		case ChubbyBunny.Bunny.STATES.IDLE:
			this._timer = this._rnd.realInRange(ChubbyBunny.Bunny.IDLE_TIME_MIN, ChubbyBunny.Bunny.IDLE_TIME_MAX);
			this.sprite.animations.play('idle');
			break;
		case ChubbyBunny.Bunny.STATES.WALK:
			this.sprite.animations.play('walk');
			break;
		case ChubbyBunny.Bunny.STATES.WAIT:
			this.sprite.animations.play('idle');
			break;
		case ChubbyBunny.Bunny.STATES.KISS:
			this.sprite.animations.play('kiss');
			break;
		case ChubbyBunny.Bunny.STATES.THROWN:
			this._force.x = ChubbyBunny.Bunny.THROWN_FORCE_X * Math.sign(this.sprite.scale.x);
			this._force.y = ChubbyBunny.Bunny.THROWN_FORCE_Y;
			break;
		case ChubbyBunny.Bunny.STATES.BORN:
			this.sprite.animations.play('born');
			break;
		case ChubbyBunny.Bunny.STATES.IN_FOX_MOUTH:
			this._offset = Math.round(Math.random() * 25) + 25;
			this.sprite.animations.play('idle');
			this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
			this.sprite.y = 122;
			break;
	}
};
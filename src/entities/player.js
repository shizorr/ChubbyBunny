ChubbyBunny.Player = function(state) {
	var sprite = state.add.sprite(this._moveto, ChubbyBunny.FLOOR_Y, 'bunny');
	sprite.anchor.setTo(.5, 1);
	sprite.animations.add('idle', [0, 1, 2, 3, 4, 5], 12, true);
	sprite.animations.add('walk', [6, 7, 8, 9, 10, 11], 12, true);
	sprite.animations.add('kiss', [12, 13, 14, 15], 12, true);
	sprite.animations.add('carry_idle', [24], 0, false);
	sprite.animations.add('carry_walk', [25, 26, 27, 28, 29, 30], 12, true);
	sprite.animations.play('idle');
	this.sprite = sprite;

	this._sfxPickUp = state.add.audio('pick_up', .7);
	this._sfxThrow = state.add.audio('throw', .7);
};

ChubbyBunny.Player.STATES = {
	IDLE: 0,
	WALK: 1,
	KISS: 2,
	CARRY_IDLE: 3,
	CARRY_WALK: 4,
};
ChubbyBunny.Player.WALK_DEATH_ZONE = 8;
ChubbyBunny.Player.WALK_SPEED = 60;
ChubbyBunny.Player.KISS_DISTANCE = 16;
ChubbyBunny.Player.PICK_UP_DISTANCE = 8;
ChubbyBunny.Player.CARRY_OFFSET_Y = -24;

ChubbyBunny.Player.prototype.initialize = function() {
	this._setState(ChubbyBunny.Player.STATES.IDLE);
	this._moveto = this.sprite.x = 0;
	this._target = null;

	this.love = 1;
	this.spawnBunnies = false;
};

ChubbyBunny.Player.prototype.update = function(deltaTime, pointer) {
	this.spawnBunnies = false;

	if (pointer.isDown) {
		this._moveto = pointer.worldX;
	}

	var deltaMov = this._moveto - this.sprite.x;
	var dirMov = Math.sign(deltaMov);
	deltaMov = Math.abs(deltaMov);

	this.love = (this._state === ChubbyBunny.Player.STATES.KISS) ?
		Math.max(this.love - (.25 * deltaTime), 0) :
		Math.min(this.love + (.15 * deltaTime), 1);

	switch (this._state) {
		case ChubbyBunny.Player.STATES.IDLE:
		case ChubbyBunny.Player.STATES.WALK:
			if (this._target !== null) {
				if ((this.love >= 1) && (deltaMov < ChubbyBunny.Player.KISS_DISTANCE)) {
					this._setState(ChubbyBunny.Player.STATES.KISS);
					break;
				}
				else if (deltaMov < ChubbyBunny.Player.PICK_UP_DISTANCE) {
					this._setState(ChubbyBunny.Player.STATES.CARRY_IDLE);
					this._sfxPickUp.play();
					break;
				}
			}
			break;
	}

	switch(this._state) {
		case ChubbyBunny.Player.STATES.IDLE:
			if (deltaMov >= ChubbyBunny.Player.WALK_DEATH_ZONE) {
				this._setState(ChubbyBunny.Player.STATES.WALK);
			}
			break;
		case ChubbyBunny.Player.STATES.WALK:
			if (deltaMov < ChubbyBunny.Player.WALK_DEATH_ZONE / 2) {
				this._setState(ChubbyBunny.Player.STATES.IDLE);
			}
			else {
				this.sprite.x += dirMov * deltaTime * ChubbyBunny.Player.WALK_SPEED;
				this._flipSpriteX(dirMov < 0);
			}
			break;
		case ChubbyBunny.Player.STATES.KISS:
			if (this.love <= 0) {
				this._setState(ChubbyBunny.Player.STATES.IDLE);
				this._target.resume();
				this._target = null;
				this.spawnBunnies = true;
			}
			else if (this._target === null) {
				this._setState(ChubbyBunny.Player.STATES.IDLE);
			}
			break;
		case ChubbyBunny.Player.STATES.CARRY_IDLE:
			if (deltaMov >= ChubbyBunny.Player.WALK_DEATH_ZONE) {
				this._setState(ChubbyBunny.Player.STATES.CARRY_WALK);
			}
			this._target.sprite.x = this.sprite.x;
			this._target.flipSpriteX(this.sprite.scale.x < 0);
			break;
		case ChubbyBunny.Player.STATES.CARRY_WALK:
			if (deltaMov < ChubbyBunny.Player.WALK_DEATH_ZONE / 2) {
				if (pointer.isDown) {
					this._setState(ChubbyBunny.Player.STATES.CARRY_IDLE);
				}
				else {
					this._setState(ChubbyBunny.Player.STATES.IDLE);
					this._target.throw();
					this._target = null;

					this._sfxThrow.play();
				}
			}
			else {
				this.sprite.x += dirMov * deltaTime * ChubbyBunny.Player.WALK_SPEED;
				this._flipSpriteX(dirMov < 0);

				this._target.sprite.x = this.sprite.x;
				this._target.flipSpriteX(dirMov < 0);
			}
			break;
	}

	if (this.sprite.x < ChubbyBunny.BUNNY_MIN_X) {
		this.sprite.x = this._moveto = ChubbyBunny.BUNNY_MIN_X;
	}
};

ChubbyBunny.Player.prototype.setTarget = function(target) {
	if ((this._target === target) ||
		(this._state == ChubbyBunny.Player.STATES.CARRY_IDLE) ||
		(this._state == ChubbyBunny.Player.STATES.CARRY_WALK)) { return; }
	if (this._target !== null) { this._target.resume(); }
	this._target = target;
	if (this._target !== null) {
		target.wait();
		this._setState(ChubbyBunny.Player.STATES.IDLE);
	}
};

ChubbyBunny.Player.prototype._setState = function(state) {
	this._state = state;
	switch (this._state) {
		case ChubbyBunny.Player.STATES.IDLE:
			this.sprite.animations.play('idle');
			break;
		case ChubbyBunny.Player.STATES.WALK:
			this.sprite.animations.play('walk');
			break;
		case ChubbyBunny.Player.STATES.KISS:
			this.sprite.animations.play('kiss');
			var flipSpriteX = this._target.sprite.x < this.sprite.x;
			this._flipSpriteX(flipSpriteX);
			this._target.flipSpriteX(!flipSpriteX);
			this._target.kiss();
			this._moveto = this.sprite.x;
			break;
		case ChubbyBunny.Player.STATES.CARRY_IDLE:
			this.sprite.animations.play('carry_idle');
			this._target.sprite.y = this.sprite.y + ChubbyBunny.Player.CARRY_OFFSET_Y;
			this._target.sprite.bringToTop();
			break;
		case ChubbyBunny.Player.STATES.CARRY_WALK:
			this.sprite.animations.play('carry_walk');
			break;
	}
};

ChubbyBunny.Player.prototype._flipSpriteX = function(flip) {
	this.sprite.scale.x = (flip ? -1 : 1) * Math.abs(this.sprite.scale.x);
};
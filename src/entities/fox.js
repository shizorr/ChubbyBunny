ChubbyBunny.Fox = function(state) {
	this._timer = 0;

	var body = state.add.group();
	var foxBodyNames = ['fox_body_bg', 'fox_body_fg', 'fox_head_bg'];
	for (var i = 0, len = foxBodyNames.length; i < len; i++) {
		var sprite = state.add.sprite(0, 0, foxBodyNames[i], null, body);
		sprite.anchor.setTo(0, 1);
	}
	body.scale.setTo(2, 2);
	body.y = ChubbyBunny.FLOOR_Y;
	this._body = body;

	var head = state.add.sprite(0, 0, 'fox_head_fg');
	head.anchor.setTo(0, 1);
	head.scale.setTo(2, 2);
	head.y = ChubbyBunny.FLOOR_Y;
	head.animations.add('idle', [0], 0, false);
	head.animations.add('snap', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0], 24, false);
	head.animations.add('close', [0, 1, 2, 3, 4, 5], 24, false);
	head.animations.add('aboutToSnap', [0, 1, 2, 1], 1, true);
	this.head = head;

	this.bunniesEaten = false;
};

ChubbyBunny.Fox.INITIAL_X = 128;
ChubbyBunny.Fox.SNAP_TIME = 10;
ChubbyBunny.Fox.SNAP_INCREMENT = 2.3;
ChubbyBunny.Fox.SPEED_MIN = 4;
ChubbyBunny.Fox.SPEED_MAX = 8;
ChubbyBunny.Fox.BUNNY_SPEED_MULTIPLIER = 1;

ChubbyBunny.Fox.prototype.initialize = function() {
	this.numBunnies = 0;
	this._body.x = ChubbyBunny.Fox.INITIAL_X;
	this.head.x = ChubbyBunny.Fox.INITIAL_X;
	this.head.animations.play('idle');

	this.x = ChubbyBunny.Fox.INITIAL_X;
};

ChubbyBunny.Fox.prototype.update = function(deltaTime) {
	this.bunniesEaten = false;
	
	if (this.numBunnies > 0) {
		this._timer -= deltaTime;

		if (this._timer <= 0) {
			this.bunniesEaten = true;
			this.numBunnies = 0;
			this.head.animations.play('snap');
		}
		else {
			this.head.animations.currentAnim.speed = Math.max(ChubbyBunny.Fox.SNAP_TIME - this._timer, 1);
		}
	}

	var speed = Math.max(
		ChubbyBunny.Fox.SPEED_MAX - (this.numBunnies * ChubbyBunny.Fox.BUNNY_SPEED_MULTIPLIER),
		ChubbyBunny.Fox.SPEED_MIN);
	this.x -= speed * deltaTime;
	this._body.x = this.head.x = this.x;
};

ChubbyBunny.Fox.prototype.addBunny = function() {
	if (this.numBunnies++ <= 0) {
		this._timer = ChubbyBunny.Fox.SNAP_TIME;
		this.head.animations.play('aboutToSnap');
	}
	else
		this._timer += ChubbyBunny.Fox.SNAP_INCREMENT;
};

ChubbyBunny.Fox.prototype.choke = function() {
	this.head.animations.play('close');
};

ChubbyBunny.Fox.prototype.eatPlayer = function() {
	this.head.animations.play('close');
};
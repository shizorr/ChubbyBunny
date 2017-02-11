var game = new Phaser.Game(240, 160, Phaser.AUTO, 'content', { preload: preload, create: create, update: update, render: render }, null, false);

BunnyState = {
	IDLE: 0,
	WALKING: 1,
	KISSING: 2,
	BORN: 3,
}

var background;
var platforms;

var bunnies;
var targetBunny;
var loveMeter;

var player;
var playerState;
var destination;

function preload() {

	game.load.image('background', 'assets/scene.png?v=3');
	game.load.image('floor', 'assets/floor.png');
	game.load.image('fox', 'assets/fox.png');
	game.load.spritesheet('bunny_male', 'assets/bunny_male.png?v=3', 32, 32);
	game.load.spritesheet('bunny_female', 'assets/bunny_female.png', 18, 31, 12, 0, 1);
}

function create() {

	Phaser.Canvas.setImageRenderingCrisp(game.canvas);
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.scale.pageAlignHorizontally = true;
	game.scale.pageAlignVertically = true;
	game.scale.windowConstraints = { right: 'layout', bottom: 'layout' };

	//background = game.add.sprite(0, 0, 'background');

	var floor = game.add.tileSprite(-65536, 128, 65776, 32, 'floor');

	var fox = game.add.sprite(128, 48, 'fox');

	bunnies = Array(100);
	for (var i = 0; i < bunnies.length; i++) {

		var bunny = {
			sprite: game.add.sprite(i, 128, 'bunny_male'),
			state: BunnyState.IDLE,
			destination: 0,
			timer: Math.random() * 3 + 2,
		}

		bunny.sprite.anchor.setTo(.5, 1);
		bunny.sprite.animations.add('idle', [0, 1, 2, 3, 4, 5], 12, true);
		bunny.sprite.animations.add('walk', [6, 7, 8, 9, 10, 11], 12, true);
		bunny.sprite.animations.add('kiss', [12, 13, 14, 15], 12, true);
		bunny.sprite.animations.add('born', [16, 17, 18, 19, 20, 21, 22, 23], 16, false);
		bunny.sprite.animations.play('idle');
		bunny.sprite.inputEnabled = true;
		bunny.sprite.input.useHandCursor = true;
		bunny.sprite.visible = false;

		bunnies[i] = bunny;
	}
	bunnies[0].sprite.visible = true;
	loveMeter = 0;

	player = game.add.sprite(8, 128, 'bunny_male');
	player.anchor.setTo(.5, 1);
	player.animations.add('idle', [0, 1, 2, 3, 4, 5], 12, true);
	player.animations.add('walk', [6, 7, 8, 9, 10, 11], 12, true);
	player.animations.add('kiss', [12, 13, 14, 15], 12, true);
	player.animations.play('idle');
	playerState = BunnyState.IDLE;
	destination = player.x;

	game.camera.bounds = null;
	game.input.maxPointers = 1;
}

function update() {

	// update AI bunnies
	for (var i = 0; i < bunnies.length; i++) {

		var bunny = bunnies[i];
		if (!bunny.sprite.visible) { continue; }
		bunny.timer -= game.time.physicsElapsed;

		if (bunny == targetBunny) { continue; }

		switch (bunny.state) {
			case BunnyState.IDLE:
				if (bunny.timer <= 0) {
					bunny.sprite.animations.play('walk');
					bunny.destination = bunny.sprite.x + ((Math.random() < .5) ? -1 : 1) * ((Math.random() * 50) + 50);
					bunny.sprite.scale.x = Math.sign(bunny.destination - bunny.sprite.x) * Math.abs(bunny.sprite.scale.x);
					bunny.state = BunnyState.WALKING;
				} break;
			case BunnyState.WALKING:
				var distance = bunny.destination - bunny.sprite.x;
				bunny.sprite.x += Math.sign(distance) * game.time.physicsElapsed * 40;

				if (Math.abs(distance) < 8) {

					bunny.sprite.animations.play('idle');
					bunny.state = BunnyState.IDLE;
					bunny.timer = Math.random() * 3 + 2;
				} break;
			case BunnyState.BORN:
				if (bunny.sprite.animations.currentAnim.isFinished) {
					bunny.sprite.animations.play('idle');
					bunny.state = BunnyState.IDLE;
					bunny.timer = Math.random() * 3 + 2;
				} break;
		}
	}

	// handle touch/mouse down
	var pointer = game.input.activePointer;
	if (pointer.isDown) {
		destination = pointer.worldX;

		var setTargetBunny = true;
		if (targetBunny != null) {
			var rect = new Phaser.Rectangle(targetBunny.sprite.left, targetBunny.sprite.top, targetBunny.sprite.width, targetBunny.sprite.height);
			if (rect.contains(pointer.worldX, pointer.worldY)) {
				setTargetBunny = false;
				destination = targetBunny.sprite.x;
			} else {
				targetBunny.sprite.animations.play('idle');
				targetBunny.state = BunnyState.IDLE;
				targetBunny.timer = Math.random() * 3 + 2;
			}
		}

		if (setTargetBunny) {
			targetBunny = null;
			for (var i = 0; i < bunnies.length; i++) {
				var bunny = bunnies[i];
				if (!bunny.sprite.visible) { continue; }
				var rect = new Phaser.Rectangle(bunny.sprite.left, bunny.sprite.top, bunny.sprite.width, bunny.sprite.height);
				if (rect.contains(pointer.worldX, pointer.worldY)) {
					targetBunny = bunny;
					targetBunny.sprite.animations.play('idle');
					targetBunny.state = BunnyState.IDLE;
					destination = targetBunny.sprite.x;
					break;
				}
			}
		}

		if ((targetBunny == null) && !((playerState == BunnyState.IDLE) || (playerState == BunnyState.WALKING))) {
			player.animations.play('idle');
			playerState = BunnyState.IDLE;
		}
	}

	loveMeter = (playerState == BunnyState.KISSING) ?
		Math.max(loveMeter - game.time.physicsElapsed, 0) :
		Math.min(loveMeter + game.time.physicsElapsed, 1);

	var deltaDest = destination - player.x;
	var dirDest = Math.sign(deltaDest);
	deltaDest = Math.abs(deltaDest);

	// update player
	switch (playerState) {
		case BunnyState.IDLE:
			if (deltaDest > 8) {
				player.animations.play('walk');
				playerState = BunnyState.WALKING;
			} break;
		case BunnyState.WALKING:
			if (deltaDest < 8) {
				player.animations.play('idle');
				playerState = BunnyState.IDLE;
			} else {
				player.x += dirDest * game.time.physicsElapsed * 60;
				player.scale.x = dirDest * Math.abs(player.scale.x);
			} break;
	}

	// handle target bunny
	if (targetBunny != null) {
		switch (playerState) {
			case BunnyState.IDLE:
			case BunnyState.WALKING:
				if (deltaDest < 16) {
					if (loveMeter >= 1) {
						targetBunny.sprite.animations.play('kiss');
						targetBunny.sprite.scale.x = -dirDest * Math.abs(targetBunny.sprite.scale.x);
						targetBunny.state = BunnyState.KISSING;
						player.animations.play('kiss');
						player.scale.x = dirDest * Math.abs(player.scale.x);
						playerState = BunnyState.KISSING;
					}
				} break;
		case BunnyState.KISSING:
			if (loveMeter <= 0) {
				var numBabies = Math.random() * 3 + 1;
				for (var i = 0; i < bunnies.length; i++) {
					if (!bunnies[i].sprite.visible) {
						bunnies[i].sprite.visible = true;
						bunnies[i].sprite.x = targetBunny.sprite.x + ((Math.random() < .5) ? -1 : 1) * ((Math.random() * 20) + 10);
						bunnies[i].sprite.animations.play('born');
						bunnies[i].state = BunnyState.BORN;
						if (--numBabies <= 0) break;
					}
				}

				player.animations.play('idle');
				playerState = BunnyState.IDLE;
				targetBunny.sprite.animations.play('idle');
				targetBunny.state = BunnyState.IDLE;
				targetBunny.timer = Math.random() * 3 + 2;
				targetBunny = null;
			} break;
		}
	}

	game.camera.x = player.x - 120;
}

function render() {
	game.debug.text(loveMeter, 8, 8);
}
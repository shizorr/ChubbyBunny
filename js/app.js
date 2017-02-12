var game = new Phaser.Game(240, 160, Phaser.AUTO, 'content', { preload: preload, create: create, update: update, render: render }, null, false);

BunnyState = {
	IDLE: 0,
	WALKING: 1,
	KISSING: 2,
	BORN: 3,
	THROWN: 4,
	EATEN: 5,
	FLEE: 6,
}

var background;
var platforms;

var foxBg;
var foxFg;

var bunnies;
var targetBunny;
var loveMeter;

var player;
var playerState;
var isCarrying;
var destination;

function preload() {

	game.load.image('background', 'assets/scene.png?v=3');
	game.load.image('floor', 'assets/floor.png');
	game.load.spritesheet('bunny_male', 'assets/bunny_male.png?v=3', 32, 32);
	game.load.spritesheet('bunny_female', 'assets/bunny_female.png', 18, 31, 12, 0, 1);

	game.load.image('fox_body_bg', 'assets/fox_body_bg.png');
	game.load.image('fox_body_fg', 'assets/fox_body_fg.png');
	game.load.image('fox_head_bg', 'assets/fox_head_bg.png');
	game.load.image('fox_head_fg', 'assets/fox_head_fg.png');
}

function create() {

	Phaser.Canvas.setImageRenderingCrisp(game.canvas);
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.scale.pageAlignHorizontally = true;
	game.scale.pageAlignVertically = true;
	game.scale.windowConstraints = { right: 'layout', bottom: 'layout' };

	//background = game.add.sprite(0, 0, 'background');

	var floor = game.add.tileSprite(-1000000, 128, 2000000, 32, 'floor');

	foxBg = game.add.group();
	foxBg.addMultiple([
		game.add.sprite(0, 0, 'fox_body_bg'),
		game.add.sprite(0, 0, 'fox_head_bg')]);
	foxFg = game.add.group();
	foxFg.addMultiple([
		game.add.sprite(0, 0, 'fox_body_fg'),
		game.add.sprite(0, 0, 'fox_head_fg')]);
	foxBg.scale.setTo(2, 2);
	foxFg.scale.setTo(2, 2);
	foxBg.y = 48;
	foxFg.y = 48;

	bunnies = Array(100);
	for (var i = 0, len = bunnies.length; i < len; i++) {

		var bunny = {
			sprite: game.add.sprite(0, 128, 'bunny_male'),
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

		bunnies[i] = bunny;
	}

	player = game.add.sprite(0, 128, 'bunny_male');
	player.anchor.setTo(.5, 1);
	player.animations.add('idle', [0, 1, 2, 3, 4, 5], 12, true);
	player.animations.add('walk', [6, 7, 8, 9, 10, 11], 12, true);
	player.animations.add('kiss', [12, 13, 14, 15], 12, true);
	player.animations.add('idle_carrying', [24], 0);
	player.animations.add('walk_carrying', [25, 26, 27, 28, 29, 30], 12, true);

	game.camera.bounds = null;
	game.input.maxPointers = 1;

	reset();
}

function update() {

	foxBg.x -= game.time.physicsElapsed;
	foxFg.x -= game.time.physicsElapsed;

	// update AI bunnies
	for (var i = 0, len = bunnies.length; i < len; i++) {

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
				}
				break;
			case BunnyState.WALKING:
				var distance = bunny.destination - bunny.sprite.x;
				bunny.sprite.x += Math.sign(distance) * game.time.physicsElapsed * 40;

				if (Math.abs(distance) < 8) {

					bunny.sprite.animations.play('idle');
					bunny.state = BunnyState.IDLE;
					bunny.timer = Math.random() * 3 + 2;
				}
				break;
			case BunnyState.BORN:
				if (bunny.sprite.animations.currentAnim.isFinished) {
					bunny.sprite.animations.play('idle');
					bunny.state = BunnyState.IDLE;
					bunny.timer = Math.random() * 3 + 2;
				}
				break;
			case BunnyState.THROWN:
				bunny.sprite.x += bunny.force.x * game.time.physicsElapsed;
				bunny.sprite.y += bunny.force.y * game.time.physicsElapsed;
				bunny.force.y += 15;

				if (bunny.sprite.y >= 128) {
					bunny.sprite.y = 128;

					bunny.sprite.animations.play('idle');
					bunny.state = BunnyState.IDLE;
					bunny.timer = Math.random() * 3 + 2;
				}
				break;
			case BunnyState.EATEN:
				bunny.sprite.x = foxBg.left + bunny.offset;
				bunny.sprite.y = foxBg.bottom - 6;
				bunny.sprite.scale.x = -Math.abs(bunny.sprite.scale.x);
				break;
		}

		if ((bunny.state != BunnyState.EATEN) && (bunny.sprite.x >= foxBg.x + 12)) {
			bunny.sprite.animations.play('idle');
			bunny.sprite.inputEnabled = false;
			bunny.state = BunnyState.EATEN;
			bunny.offset = Math.round(Math.random() * 25) + 25;
		}
	}

	// handle touch/mouse down
	var pointer = game.input.activePointer;
	if (pointer.isDown) {
		destination = pointer.worldX;

		if (!isCarrying) {
			var setTargetBunny = true;
			if (targetBunny != null) {
				// note: due to sprite.input.pointerOver() behaving weird resorted to checking the bound contain myself
				var rect = new Phaser.Rectangle(Math.min(targetBunny.sprite.left, targetBunny.sprite.right), targetBunny.sprite.top, Math.abs(targetBunny.sprite.width), targetBunny.sprite.height);
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
				for (var i = 0, len = bunnies.length; i < len; i++) {
					var bunny = bunnies[i];
					if (!bunny.sprite.visible) { continue; }
					// note: due to sprite.input.pointerOver() behaving weird resorted to checking the bound contain myself
					var rect = new Phaser.Rectangle(Math.min(bunny.sprite.left, bunny.sprite.right), bunny.sprite.top, Math.abs(bunny.sprite.width), bunny.sprite.height);
					if (rect.contains(pointer.worldX, pointer.worldY)) {
						targetBunny = bunny;
						targetBunny.sprite.animations.play('idle');
						targetBunny.sprite.bringToTop();
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
	}

	loveMeter = (playerState == BunnyState.KISSING) ?
	 	Math.max(loveMeter - game.time.physicsElapsed / 2, 0) :
	 	Math.min(loveMeter + game.time.physicsElapsed / 5, 1);

	var deltaDest = destination - player.x;
	var dirDest = Math.sign(deltaDest);
	deltaDest = Math.abs(deltaDest);

	// update player
	switch (playerState) {
		case BunnyState.IDLE:
			if (deltaDest >= 8) {
				if (isCarrying) {
					player.animations.play('walk_carrying');
				} else {
					player.animations.play('walk');
				}
				playerState = BunnyState.WALKING;
			}
			break;
		case BunnyState.WALKING:
			if (player.x > foxBg.x + 8) {
				reset();
			}
			if (deltaDest < 8) {
				if (isCarrying) {
					if (!pointer.isDown && targetBunny.timer <= 0) {
						targetBunny.force = new Phaser.Point(dirDest * 200, -100);
						targetBunny.state = BunnyState.THROWN;
						isCarrying = false;
						targetBunny = null;
						player.animations.play('idle');
					} else {
						player.animations.play('idle_carrying');
					}
				} else {
					player.animations.play('idle');
				}

				playerState = BunnyState.IDLE;
			} else {
				player.x += dirDest * game.time.physicsElapsed * 60;
				player.scale.x = dirDest * Math.abs(player.scale.x);
			}
			break;
	}

	// handle target bunny
	if (targetBunny != null) {
		switch (playerState) {
			case BunnyState.IDLE:
			case BunnyState.WALKING:
				if (!isCarrying) {
					if (deltaDest < 16) {
						if (loveMeter >= 1) {
							targetBunny.sprite.animations.play('kiss');
							targetBunny.sprite.scale.x = -dirDest * Math.abs(targetBunny.sprite.scale.x);
							targetBunny.state = BunnyState.KISSING;
							player.animations.play('kiss');
							player.scale.x = dirDest * Math.abs(player.scale.x);
							playerState = BunnyState.KISSING;
							break;
						} 
					}
					if (deltaDest < 8) {
						player.animations.play('idle_carrying');
						playerState = BunnyState.IDLE;
						isCarrying = true;
						targetBunny.timer = .5;
					}
				}
				break;
		case BunnyState.KISSING:
			if (loveMeter <= 0) {
				var numBabies = Math.random() * 3 + 1;
				for (var i = 0, len = bunnies.length; i < len; i++) {
					if (!bunnies[i].sprite.visible) {
						bunnies[i].sprite.visible = true;
						bunnies[i].sprite.x = targetBunny.sprite.x + ((Math.random() < .5) ? -1 : 1) * ((Math.random() * 20) + 10);
						bunnies[i].sprite.y = 128;
						bunnies[i].sprite.animations.play('born');
						bunnies[i].sprite.inputEnabled = true;
						bunnies[i].sprite.input.useHandCursor = true;
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
			}
			break;
		}
	}

	game.camera.x = player.x - 120;

	player.bringToTop();
	if (isCarrying) {
		targetBunny.sprite.position = new Phaser.Point(player.x, player.y - 24);
		targetBunny.sprite.scale.x = Math.sign(player.scale.x) * Math.abs(targetBunny.sprite.scale.x);
		targetBunny.sprite.bringToTop();
	}

	game.world.bringToTop(foxFg);
}

function render() {
	game.debug.text(loveMeter, 8, 8);
}

function reset() {
	foxBg.x = 128;
	foxFg.x = 128;

	for (var i = 1, len = bunnies.length; i < len; i++) {
		bunnies[i].sprite.visible = false;
	}
	bunnies[0].sprite.x = -16;
	bunnies[0].sprite.y = 128;
	bunnies[0].sprite.scale.x = Math.abs(bunnies[0].sprite.scale.x);
	bunnies[0].sprite.inputEnabled = true;
	bunnies[0].sprite.input.useHandCursor = true;
	bunnies[0].sprite.visible = true;
	bunnies[0].state = BunnyState.IDLE;
	bunnies[0].timer = Math.random() * 3 + 2;

	targetBunny = null;
	loveMeter = 0;

	player.x = 0;
	player.animations.play('idle');
	playerState = BunnyState.IDLE;
	isCarrying = false;
	destination = player.x;
}
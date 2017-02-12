var game = new Phaser.Game(240, 160, Phaser.AUTO, 'content', { preload: preload, create: create, update: update, render: render }, null, false);

BunnyState = {
	IDLE: 0,
	WALKING: 1,
	KISSING: 2,
	BORN: 3,
	THROWN: 4,
	EATEN: 5,
}

var background;
var platforms;

var foxBg;
var foxFg;
var snapTimer;
var numBunniesInMouth;

var bunnies;
var targetBunny;
var loveMeter;

var player;
var playerState;
var isCarrying;
var destination;

var heart;

function preload() {

	game.load.image('background', 'assets/background.png?v=1');
	game.load.image('floor', 'assets/floor.png?v=1');
	game.load.image('wall', 'assets/wall.png');
	game.load.spritesheet('bunny', 'assets/bunny.png', 32, 32);
	game.load.spritesheet('heart', 'assets/heart.png', 16, 16);

	game.load.image('fox_body_bg', 'assets/fox_body_bg.png');
	game.load.image('fox_body_fg', 'assets/fox_body_fg.png');
	game.load.image('fox_head_bg', 'assets/fox_head_bg.png');
	game.load.image('fox_head_fg', 'assets/fox_head_fg.png');
}

function create() {

	game.world.setBounds(-256, 0, 512, 160);

	Phaser.Canvas.setImageRenderingCrisp(game.canvas);
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.scale.pageAlignHorizontally = true;
	game.scale.pageAlignVertically = true;
	game.scale.windowConstraints = { right: 'layout', bottom: 'layout' };

	game.add.tileSprite(-256, 0, 2048, 256, 'background').scale.setTo(.5, .5);
	game.add.tileSprite(-256, 128, 2048, 32, 'floor');
	game.add.tileSprite(-256, 0, 32, 128, 'wall');
	heart = game.add.sprite(5, 5, 'heart');
	heart.animations.add('progress', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 0);
	heart.animations.play('progress', 0);
	heart.fixedToCamera = true;

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
			sprite: game.add.sprite(0, 128, 'bunny'),
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

	player = game.add.sprite(0, 128, 'bunny');
	player.anchor.setTo(.5, 1);
	player.animations.add('idle', [0, 1, 2, 3, 4, 5], 12, true);
	player.animations.add('walk', [6, 7, 8, 9, 10, 11], 12, true);
	player.animations.add('kiss', [12, 13, 14, 15], 12, true);
	player.animations.add('idle_carrying', [24], 0);
	player.animations.add('walk_carrying', [25, 26, 27, 28, 29, 30], 12, true);

	game.camera.follow(player);
	game.input.maxPointers = 1;

	reset();
}

function update() {

	if (player.x > foxBg.x + 8) {
		reset();
		return;
	} 

	var foxSpeedMultiplier = Math.max(8 - numBunniesInMouth, 4);
	foxBg.x -= game.time.physicsElapsed * foxSpeedMultiplier;
	foxFg.x -= game.time.physicsElapsed * foxSpeedMultiplier;

	if ((foxBg.x <= -140) && (numBunniesInMouth >= 16)) {
		reset();
	}

	if (numBunniesInMouth > 0) {
		snapTimer -= game.time.physicsElapsed;

		if (snapTimer <= 0) {
			for (var i = 0, len = bunnies.length; i < len; i++) {
				if (bunnies[i].state == BunnyState.EATEN) {
					bunnies[i].sprite.visible = false;
				}
			}

			snapTimer = 10;
			numBunniesInMouth = 0;
		}
	}

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
					bunny.destination = Math.max(bunny.destination, - 214);
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
			bunny.state = BunnyState.EATEN;
			bunny.offset = Math.round(Math.random() * 25) + 25;
			++numBunniesInMouth;
			snapTimer += 2.2;
		}

		if (bunny.sprite.x < -214) {
			bunny.sprite.x = -214;
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
					if (!((bunny.state == BunnyState.IDLE) || (bunny.state == BunnyState.WALKING))) { continue; }
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
	 	Math.max(loveMeter - game.time.physicsElapsed / 4, 0) :
	 	Math.min(loveMeter + game.time.physicsElapsed / 6, 1);
	heart.animations.currentAnim.setFrame(Math.floor(loveMeter * 9));

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
			if (player.x < -214) {
				player.x = -214;
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
				var numBabies = Math.random() * 3 + 3;
				for (var i = 0, len = bunnies.length; i < len; i++) {
					if (!bunnies[i].sprite.visible) {
						bunnies[i].sprite.visible = true;
						bunnies[i].sprite.x = targetBunny.sprite.x + ((Math.random() < .5) ? -1 : 1) * ((Math.random() * 20) + 10);
						bunnies[i].sprite.y = 128;
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
	game.debug.text(snapTimer, 8, 8);
	game.debug.text(numBunniesInMouth, 8, 24);
}

function reset() {
	foxBg.x = 128;
	foxFg.x = 128;
	snapTimer = 10;
	numBunniesInMouth = 0;

	for (var i = 1, len = bunnies.length; i < len; i++) {
		bunnies[i].sprite.visible = false;
	}
	bunnies[0].sprite.x = -16;
	bunnies[0].sprite.y = 128;
	bunnies[0].sprite.scale.x = Math.abs(bunnies[0].sprite.scale.x);
	bunnies[0].sprite.visible = true;
	bunnies[0].sprite.animations.play('idle');
	bunnies[0].state = BunnyState.IDLE;
	bunnies[0].timer = Math.random() * 3 + 2;

	targetBunny = null;
	loveMeter = 1;

	player.x = 0;
	player.animations.play('idle');
	playerState = BunnyState.IDLE;
	isCarrying = false;
	destination = player.x;
}
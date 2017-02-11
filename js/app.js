var game = new Phaser.Game(240, 160, Phaser.AUTO, 'content', { preload: preload, create: create, update: update }, null, false);

var background;
var platforms;

var bunnies;

var player;
var destination;

function preload() {

	game.load.image('background', 'assets/scene.png?v=2');
	game.load.image('floor', 'assets/floor.png');
	game.load.image('fox', 'assets/fox.png');
	game.load.spritesheet('bunny_male', 'assets/bunny_male.png', 18, 31, 12, 0, 1);
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
			isMoving: false,
			destination: 0,
			idleTimer: Math.random() * 3 + 2,
			sprite: game.add.sprite(i, 128, 'bunny_female'),
		}

		bunny.sprite.anchor.setTo(.5, 1);
		bunny.sprite.animations.add('idle', [0, 1, 2, 3, 4, 5], 12, true);
		bunny.sprite.animations.add('walk', [6, 7, 8, 9, 10, 11], 12, true);
		bunny.sprite.animations.play('idle');

		bunnies[i] = bunny;
	}

	player = game.add.sprite(8, 128, 'bunny_male');
	player.anchor.setTo(.5, 1);
	player.animations.add('idle', [0, 1, 2, 3, 4, 5], 12, true);
	player.animations.add('walk', [6, 7, 8, 9, 10, 11], 12, true);
	player.animations.play('idle');
	destination = player.x;

	game.camera.bounds = null;
	game.input.maxPointers = 1;
}

function update() {

	for (var i = 0; i < bunnies.length; i++) {

		var bunny = bunnies[i];
		bunny.idleTimer -= game.time.physicsElapsed;
		if (!bunny.isMoving && bunny.idleTimer <= 0) {

			bunny.isMoving = true;

			bunny.destination = bunny.sprite.x + ((Math.random() < .5) ? -1 : 1) * ((Math.random() * 50) + 50);
			bunny.sprite.animations.play('walk');
		}

		if (bunny.isMoving) {
			var distance = bunny.destination - bunny.sprite.x;
			bunny.sprite.x += Math.sign(distance) * game.time.physicsElapsed * 40;
			bunny.sprite.scale.x = Math.sign(distance) * Math.abs(bunny.sprite.scale.x);

			if (Math.abs(distance) < 8) {

				bunny.isMoving = false;
				bunny.idleTimer = Math.random() * 3 + 2,
				bunny.sprite.animations.play('idle');
			}
		}
	}

	if (game.input.activePointer.isDown)
		destination = game.input.activePointer.worldX;

	var distance = destination - player.x; 
	if (Math.abs(distance) > 8)
	{
		player.x += Math.sign(distance) * game.time.physicsElapsed * 60;
		player.scale.x = Math.sign(distance) * Math.abs(player.scale.x);
		player.animations.play('walk');
	}
	else
	{
		player.animations.play('idle');
	}

	game.camera.x = player.x - 120;
}
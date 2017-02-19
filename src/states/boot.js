ChubbyBunny.Boot = function() {
	Phaser.State.call(this);
};

ChubbyBunny.Boot.prototype = Object.create(Phaser.State.prototype);
ChubbyBunny.Boot.prototype.constructor = ChubbyBunny.Boot;

ChubbyBunny.Boot.prototype.init = function() {

	// only allow 1 input touch/point
	this.input.maxPointers = 1;

	// upscale the game over the available space on the web page
	this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

	// align the game horizontally in the center on the web page
	this.scale.pageAlignHorizontally = true;
	this.scale.pageAlignVertically = true;

	// ensure the game doesn't overscale (this will show scroll bars)
	this.scale.windowConstraints = { right: 'layout', bottom: 'layout' };
	
	// set the CSS image-rendering property of this canvas to be crisp
	Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
};

ChubbyBunny.Boot.prototype.preload = function() {
	// todo: load progress bar
};

ChubbyBunny.Boot.prototype.create = function() {
	this.state.start('Preloader');
};
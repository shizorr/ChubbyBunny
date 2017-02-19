module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			options: {
				globals: {
					Phaser: false,
				},
				'-W008': true,
			},
			build: ['src/**/*.js'],
		},

		uglify: {
			options: {
				sourceMap: true,
			},
			build: {
				files: {
					'js/app.js': ['src/**/*.js'],
				},
			},
		},
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['jshint', 'uglify']);
};
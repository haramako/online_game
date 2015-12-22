var gulp = require('gulp');
//var babel = require('gulp-babel');
//var plumber = require('gulp-plumber');
//var sourcemaps = require("gulp-sourcemaps"); /* ソースマップを出力させる場合 */
//var concat = require('gulp-concat');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');

gulp.task('browserify', function(){
	var extensions = ['.js', '.json', '.es6'];
	return browserify({entries: ['./src/app.js'], debug: true, extensions: extensions})
			.transform('babelify', {presets: ['es2015']})
			.bundle()
			.on("error", function (err) { console.log("Error : " + err.message); this.emit('end'); })
			.pipe(source('public/all.js'))
			.pipe(gulp.dest('./'));
});

gulp.task('watch', function () {
  gulp.watch('./src/**/*.js', ['browserify']);
});

gulp.task('default', ['browserify']);

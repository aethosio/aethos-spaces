var del = require('del');

var gulp = require('gulp');
var babel = require('gulp-babel');
var changed = require('gulp-changed');
var nodemon = require('gulp-nodemon');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var eslint = require('gulp-eslint');

var runSequence = require('run-sequence');
var vinylPaths = require('vinyl-paths');

/*
  Task to clean up dist directory
 */
gulp.task('clean', function() {
  return gulp.src(['dist'])
    .pipe(vinylPaths(del));
});

gulp.task('eslint', function() {
  return gulp.src('src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

/*
  Task to compile js code with babel
 */
gulp.task('build-js', ['eslint'], function() {
  var compilerOptions = {
    plugins: ["transform-decorators-legacy", "transform-class-properties"]
  };
  return gulp.src('src/**/*.js')
    .pipe(plumber())
    .pipe(changed('dist/', { extension: '.js' }))
    .pipe(sourcemaps.init())
    .pipe(babel(compilerOptions))
    .pipe(sourcemaps.write({ includeContent: false, sourceRoot: '/src/' }))
    .pipe(gulp.dest('dist/'));
});

/*
  Task to clean and build the entire library
 */
gulp.task('build', function(callback) {
  return runSequence(['build-js'], callback);
});

gulp.task('watch', ['build'], function() {
  nodemon({
    watch: ['./src'],
    ext: 'js',
    // script: './dist/index.js',
    tasks: ['build']
  });
});

gulp.task('default', ['watch']);

var gulp = require('gulp');
var zip = require('gulp-zip');
var chmod = require('gulp-chmod');
var del = require('del');
var install = require('gulp-install');
var runSequence = require('run-sequence');
var AWS = require('aws-sdk');
var fs = require('fs');

console.log('running gulpfile');

gulp.task('clean', function() {
  console.log('running clean');
  return del(['./dist', './dist.zip']);
});

gulp.task('js', function() {
  return gulp.src('index.js')
    .pipe(gulp.dest('dist/'));
});

gulp.task('node-mods', function() {
  return gulp.src('./package.json')
    .pipe(gulp.dest('dist/'))
    .pipe(install({production: true}));
});

gulp.task('zip', function() {
  return gulp.src(['dist/**/*', '!dist/package.json'])
	.pipe(chmod(0o777))
    .pipe(zip('dist.zip'))
    .pipe(gulp.dest('./'));
});

gulp.task('upload', function(callback) {
  var config = {
    accessKeyId: process.env.SOUNDCLOUD_PROJECT_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.SOUNDCLOUD_PROJECT_AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
    role: process.env.SOUNDCLOUD_PROJECT_ROLE_EXECUTION_STRING,
    functionName: 'soundcloudNetworkRequestHandler2',
  }
  
  var lambda = new AWS.Lambda({
    region: config.region,
  	accessKeyId: "accessKeyId" in config ? config.accessKeyId : "",
  	secretAccessKey: "secretAccessKey" in config ? config.secretAccessKey : "",
  	sessionToken: "sessionToken" in config ? config.sessionToken : "",
  });

  fs.readFile('./dist.zip', function(err, data) {
  	lambda.updateFunctionCode({FunctionName: config.functionName, ZipFile: data }, function(err, data) {
      if (err) {
        console.log('failed to update code');
      } else {
        console.log('successfully updated code');
      }
  	});
  });
  
});

gulp.task('deploy', function(callback) {
  return runSequence(
    ['clean'],
    ['js', 'node-mods'],
    ['zip'],
    ['upload'],
    callback
  );
});
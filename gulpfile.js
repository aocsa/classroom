'use strict';


require('es6-promise').polyfill();


var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');


var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var merge = require('merge-stream');
var path = require('path');
var fs = require('fs');
var glob = require('glob-all');
var historyApiFallback = require('connect-history-api-fallback');

gulp.task('styles', function() {
  return sass('assets/scss/main.scss', { style: 'expanded' })
    .pipe(gulp.dest('assets/dist/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(cssnano())
    .pipe(gulp.dest('assets/dist/css'))
    .pipe(notify({ message: 'SCSS files done motherfucker!' }));
});

gulp.task('scripts', function() {
  return gulp.src('assets/js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('assets/dist/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('assets/dist/js'))
    .pipe(notify({ message: 'JS files done!' }));
});

gulp.task('clean', function() {
  return del(['assets/dist/css', 'assets/dist/js']);
});

gulp.task('default', ['clean'], function() {
  gulp.start('styles', 'scripts');
});


// Watch files for changes & reload
gulp.task('serve', ['styles'], function() {
    browserSync({
        port: 3000,
        notify: false,
        logPrefix: 'PSK',
        snippetOptions: {
            rule: {
                match: '<span id="browser-sync-binding"></span>',
                fn: function(snippet) {
                    return snippet;
                }
            }
        },
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: {
            baseDir: ['.tmp', ''],
            middleware: [historyApiFallback()]
        }
    });

    gulp.watch(['**/*.html', '!bower_components/**/*.html'], reload);
    gulp.watch(['assets/img/**/*'], reload);
    gulp.watch(['assets/**/*'], reload);
    gulp.watch(['assets/**/*.scss'], reload);
    gulp.watch(['assets/js/*.js'], reload);


});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function() {
    browserSync({
        port: 3001,
        notify: false,
        logPrefix: 'PSK',
        snippetOptions: {
            rule: {
                match: '<span id="browser-sync-binding"></span>',
                fn: function(snippet) {
                    return snippet;
                }
            }
        },
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: dist(),
        middleware: [historyApiFallback()]
    });
});

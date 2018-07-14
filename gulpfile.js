// gulp configuration file

// include gulp and plugins
var gulp = require('gulp'),
    newer = require('gulp-newer'), // Onlyp passes through newer source files
    preprocess = require('gulp-preprocess'), // Processes HTML, jScript and other files based on custom or ENV config
    size = require('gulp-size'), // Displays project size
    htmlclean = require('gulp-htmlclean'), // Minifies HTML
    imagemin = require('gulp-imagemin'), // Minimizes/optimizes images
    del = require('del'), // delete files and folders using globs
    pkg = require('./package.json');

// file locations
var devBuild = ((process.env.NODE_ENV || 'development')
                .trim().toLowerCase() !== 'production'),
    source = 'source/',
    dest = 'build/',

    // define source/destination files for html
    html = {
        in: source + '*.html',
        watch: [source + '*.html', source + 'template/**/*'],
        out: dest,
        context: {
            devBuild: devBuild,
            author: pkg.author,
            version: pkg.version
        }
    },

    // define source/destination location of image files
    images = {
        in: source + 'images/*.*',
        out: dest + 'images/'
    };

// show build type
console.log(pkg.name + ' ' +
            pkg.version + ', ' +
            (devBuild ? 'development' : 'production') + ' build');

// clean the build folder
gulp.task('clean', function() {
    del([dest + '*']).then(paths => {
        console.log('Deleted files and folders:\n',
                    paths.join('\n'));
    });
});

// build HTML files
gulp.task('html', function() {
    var page = gulp.src(html.in).pipe(preprocess({ context: html.context }));

    console.log("devBuild: ", devBuild);

    if (!devBuild) {
        page = page
            .pipe(size({ title: 'HTML in' }))
            .pipe(htmlclean())
            .pipe(size({ title: 'HTML out' }));
    }

    return page.pipe(gulp.dest(html.out));
});

// manage images
gulp.task('images', function () {
    // copies image files into build folder
    return gulp.src(images.in)
        .pipe(newer(images.out))
        .pipe(imagemin())
        .pipe(gulp.dest(images.out));
});

// default task
gulp.task('default', ['html', 'images'], function() {
    // html changes
    gulp.watch(html.watch, ['html']);

    // image changes
    gulp.watch(images.in, ['images']);
});

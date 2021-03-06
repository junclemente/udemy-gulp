// gulp configuration file

// include gulp and plugins
// Package descriptions found at www.npmjs.com
var gulp = require('gulp'),
    newer = require('gulp-newer'), // Only passes through newer source files
    concat = require('gulp-concat'),
    preprocess = require('gulp-preprocess'), // Processes HTML, jScript and other files based on custom or ENV config
    size = require('gulp-size'), // Displays project size
    htmlclean = require('gulp-htmlclean'), // Minifies HTML
    imagemin = require('gulp-imagemin'), // Minimizes/optimizes images
    imacss = require('gulp-imacss'), // Converts inline images to dataURI
    sass = require('gulp-sass'), // Sass plugin for Gulp
    pleeease = require('gulp-pleeease'), // pluging for pleeease
    jshint = require('gulp-jshint'), // Add jshint dependency
    deporder = require('gulp-deporder'),
    stripdebug = require('gulp-strip-debug'),
    uglify = require('gulp-uglify'),
    urlAdjuster = require('gulp-css-url-adjuster'), // sass url adjuster
    del = require('del'), // delete files and folders using globs
    browsersync = require('browser-sync').create(),
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
    },

    // define imguri location
    imguri = {
        in: source + 'images/inline/*',
        out: source + 'scss/images/',
        filename: '_datauri.scss',
        namespace: 'img'
    },

    // define css/sass
    css = {
        in: source + 'scss/main.scss',
        watch: [source + 'scss/**/*', '!' + imguri.out + imguri.filename],
        out: dest + 'css/',
        sassOpts: {
            outputStyle: 'nested',  // can be set to 'nested' or 'compressed'
            imagePath: '../images/',  // sets the path appended to all images used in CSS
            precision: 3,  // how many decimal places to use when doing calculations
            errLogToConsole: true
        },
        pleeeaseOpts: {
            autoprefixer: { browsers: ['last 2 versions', '> 2%'] },
            rem: ['16px'],
            pseudoElements: true,
            mqpacker: true,
            minifier: !devBuild
        }
    },

    // define fonts
    fonts = {
        in: source + 'fonts/*.*',
        out: css.out + 'fonts/'
    },


    // javascript
    js = {
        in: source + 'js/**/*',
        out: dest + 'js/',
        filename: 'main.js'
    };


    // browser-sync
    syncOpts = {
        server: {
            baseDir: dest,
            index: 'index.html'
        },
        open: false,
        notify: true
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

// convert inline images to dataURIS in SCSS source
gulp.task('imguri', function() {
    return gulp.src(imguri.in)
        .pipe(imagemin())
        .pipe(imacss(imguri.filename, imguri.namespace))
        .pipe(gulp.dest(imguri.out));
})

// manage fonts
gulp.task('fonts', function() {
    return gulp.src(fonts.in)
        .pipe(newer(fonts.out))
        .pipe(gulp.dest(fonts.out))
});

// compile sass
gulp.task('sass', ['imguri'], function() {  // add imguri as a dependency to sass task
    return gulp.src(css.in)
        .pipe(sass(css.sassOpts))
        .pipe(size({title: 'CSS in '}))
        .pipe(pleeease(css.pleeeaseOpts))
        .pipe(size({title: 'CSS out '}))
        .pipe(urlAdjuster({
            prepend: css.sassOpts.imagePath
        }))
        .pipe(gulp.dest(css.out))
        .pipe(browsersync.reload({ stream: true }));
});

// jshint
gulp.task('js', function() {
    if (devBuild) {
        return gulp.src(js.in)
            .pipe(newer(js.out))
            .pipe(jshint())
            .pipe(jshint.reporter('default'))
            .pipe(jshint.reporter('fail'))
            .pipe(gulp.dest(js.out));
    } else {
        del([ dest + 'js/*' ]);
        return gulp.src(js.in)
            .pipe(deporder())
            .pipe(concat(js.filename))
            .pipe(size({ title: 'JS in '}))
            .pipe(stripdebug())
            .pipe(uglify())
            .pipe(size({ title: 'JS out '}))
            .pipe(gulp.dest(js.out));
    }
});


// browser sync
gulp.task('browsersync', function() {
    browsersync.init(syncOpts);
});
// gulp.task('browsersync', function() {
//     browsersync.init({
//         server: {
//             baseDir: dest,
//             index: "index.html"
//         }
//     });
// });

// default task
gulp.task('default', ['html', 'images', 'fonts', 'sass', 'js',
          'browsersync'], function() {

    // html changes
    gulp.watch(html.watch, ['html', browsersync.reload]);

    // image changes
    gulp.watch(images.in, ['images']);

    // font changes
    gulp.watch(fonts.in, ['fonts']);

    // sass changes
    gulp.watch([css.watch, imguri.in], ['sass']);


    gulp.watch(js.in, ['js', browsersync.reload]);

});

(function () {
    'use strict';
    var nunjucksRender = require('gulp-nunjucks-render'), // Nunjucks templating system
        changedInPlace = require('gulp-changed-in-place'), // Check to see if source file(s) has updated
        htmlbeautify = require('gulp-html-beautify'), // Beautifies HTML
        autoprefixer = require('gulp-autoprefixer'), // Autoprefixes CSS using regular CSS
        neat = require('node-neat').includePaths, // The Bourbon Neat grid system
        stripDebug = require('gulp-strip-debug'), // Strip console logs on --production
        gulpPngquant = require('gulp-pngquant'), // Optmise PNGs
        sourcemaps = require('gulp-sourcemaps'), // Line numbers pointing to your SCSS files
        critical = require('critical').stream, // Inlines above the fold CSS
        cleanCSS = require('gulp-clean-css'), // Refactors CSS and combines MQs (Prod only)
        scsslint = require('gulp-scss-lint'), // SCSS Linting
        stylish = require('jshint-stylish'), // Style your jshint results
        imagemin = require('gulp-imagemin'), // Compress Images
        changed = require('gulp-changed'), // Caching
        fontmin = require('gulp-fontmin'), // Font minification - Can also generates CSS
        rename = require('gulp-rename'), // Rename files i.e. in this case rename minified files to .min
        concat = require('gulp-concat'), // Merges all files in to 1
        jshint = require('gulp-jshint'), // Lint your JS on the fly
        uglify = require('gulp-uglify'), // JS minification (Prod only)
        notify = require('gulp-notify'), // Notifications upon task completion
        svgmin = require('gulp-svgmin'), // Minimises SVGs
        debug = require('gulp-debug'), // Used for debugging
        babel = require('gulp-babel'), // ALlows for ES2015 support with this build system
        gutil = require('gulp-util'), // Used for debugging
        scss = require('gulp-sass'), // Libscss Pre-processor
        util = require('gulp-util'), // Used for prod deployment
        gulp = require('gulp'), // Gulp
        del = require('del'), // Clean folders and files
        browserSync = require('browser-sync').create(), // Create BS server
        htmlInjector = require('bs-html-injector'); // Injects markup

    // File Format
    var fileFormat = 'html',
        fileExt = '.' + fileFormat;

    // Paths object
    var src = {
        pages: 'src/pages/*' + fileExt,
        templates: 'src/templates/**/*' + fileExt,
        scss: 'src/styles/**/*.scss',
        js: 'src/scripts/**/*.js', // - if you change this path, then you'll need to update your .jshintignore file
        img: 'src/images/**/*.{jpg,gif}',
        imgPng: 'src/images/**/*.png',
        svg: 'src/images/svgs/**/*.svg',
        fonts: 'src/fonts/**/*',
        docs: 'src/docs/**/*',
        favicons: 'src/favicons/**/*'
    };

    var dist = {
        pages: './',
        css: './',
        js: 'dist/assets/js',
        img: 'dist/assets/img',
        svg: 'dist/assets/img/svg',
        fonts: 'dist/assets/fonts',
        docs: 'dist/assets/docs',
        favicons: 'dist/assets/favicons'
    };

    var config = {
        maps: 'maps', // This is where your CSS and JS sourcemaps go
        reports: 'reports', // Lint reports go here
        lint: 'src/styles/**/*.scss', // Path of SCSS files that you want to lint
        lintExclude: '!src/styles/vendor/**/*.scss', // Path of SCSS files that you want to exclude from lint
        templates: ['src/templates/', 'src/templates/partials/'],
        pagesWatch: './*' + fileExt, // Directory where pages are output
        production: !!util.env.production, // Used for prod deployment
        criticalCss: dist.css + '/style.css' // Accepts arrays e.g. [dist.css + '/components.css', dist.css + '/main.css']
    };

    // Browser Sync with code/HTML injection
    function bs() {
        browserSync.use(htmlInjector, {
            files: dist.pages + '*' + fileExt
        });
        browserSync.init({
            server: dist.pages,
            files: dist.css + '*.css',
            watchOptions: {
                awaitWriteFinish: {
                    stabilityThreshold: 500
                }
            }
        });
    }

    // Disable or enable pop up notifications
    var notifications = false;
    if (notifications) {
        process.env.DISABLE_NOTIFIER = true; // Uncomment to disables all notifications
    }

    // Files and folders to clean
    function clean() {
        del([dist.pages + '*' + fileExt, dist.css + '/*.css', dist.js, dist.img, dist.fonts, dist.docs, dist.favicons, config.maps, config.reports]);
        return gulp.src('./')
            .pipe(notify({
                message: 'Folders cleaned successfully',
                onLast: true
            }));
    }

    // $ scss-lint - SCSS Linter
    function scssLint() {
        return gulp.src([config.lint, config.lintExclude])
            .pipe(scsslint({
                'reporterOutputFormat': 'Checkstyle',
                'filePipeOutput': 'scssReport.xml',
                'config': 'scss-lint.yml'
            }))
            .pipe(gulp.dest(config.reports));
    }

    // ********************** //
    // *** Required Tasks *** //
    // ********************** //

    function styles() {
        return gulp.src(src.scss)
            .pipe(sourcemaps.init())
            .pipe(scss({
                includePaths: [src.scss]
            }))
            .on('error', notify.onError(function (error) {
                return 'An error occurred while compiling scss.\nLook in the console for details.\n' + error;
            }))
            .pipe(autoprefixer({
                browsers: ['last 2 versions', 'ie 6-10'],
                cascade: false
            }))
            .pipe(config.production ? cleanCSS({
                debug: true
            }, function (details) {
                console.log(details.name + ' file size before: ' + details.stats.originalSize + ' bytes');
                console.log(details.name + ' file size after: ' + details.stats.minifiedSize + ' bytes');
            }) : util.noop())
            .pipe(sourcemaps.write(config.maps))
            .pipe(gulp.dest(dist.css));
    }

    function scripts() {
        return gulp.src(src.js)
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter('jshint-stylish'))
            .pipe(sourcemaps.init())
            .pipe(config.production ? stripDebug() : util.noop())
            .pipe(concat('main.js'))
            .pipe(gulp.dest(dist.js))
            .pipe(rename({
                suffix: '.min'
            }))
            .pipe(babel({
                presets: ['es2015']
            }))
            .on('error', notify.onError(function (error) {
                return 'An error occurred while compiling JS.\nLook in the console for details.\n' + error;
            }))
            .pipe(config.production ? uglify() : util.noop())
            .pipe(sourcemaps.write(config.maps))
            .pipe(gulp.dest(dist.js))
            .pipe(browserSync.stream({
                once: true
            }))
    }

    function nunjucksPages() {
        nunjucksRender.nunjucks.configure([src.templates]);
        return gulp.src(src.pages)
            .pipe(debug({
                title: 'nunjucks pages:'
            }))

            .pipe(changed(dist.pages, {
                hasChanged: changed.compareLastModifiedTime
            }))
            .pipe(nunjucksRender({
                path: config.templates,
                ext: fileExt
            }))
            .on('error', notify.onError(function (error) {
                return 'An error occurred while compiling files.\nLook in the console for details.\n' + error;
            }))
            // .pipe(htmlbeautify({
            //     indentSize: 2,
            //     indent_with_tabs: true,
            //     preserve_newlines: false
            // }))
            .on('data', function () {
                gutil.log('Alert nunjucksPages()!');
            })
            .pipe(gulp.dest(dist.pages))
    }

    // Temporary workaround to get HTML injection working when editing pages is to create duplicate task and not include the caching plugin
    function nunjucksTemplates() {
        nunjucksRender.nunjucks.configure([src.templates]);
        return gulp.src([src.pages])
            .pipe(debug({
                title: 'nunjucks templates:'
            }))
            .pipe(nunjucksRender({
                path: config.templates,
                ext: fileExt
            }))
            .on('error', notify.onError(function (error) {
                return 'An error occurred while compiling files.\nLook in the console for details.\n' + error;
            }))
            // .pipe(htmlbeautify({
            //     indentSize: 2,
            //     indent_with_tabs: true,
            //     preserve_newlines: false
            // }))
            .on('data', function () {
                gutil.log('Alert nunjucksTemplates()!');
            })
            .pipe(gulp.dest(dist.pages))
    }

    // Save for web in PS first!
    function images() {
        return gulp.src(src.img, {
                allowEmpty: true
            })
            .pipe(changed(dist.img, {
                hasChanged: changed.compareLastModifiedTime
            }))
            .pipe(imagemin({
                optimizationLevel: 7,
                progressive: true,
                interlaced: true
            }))
            .pipe(gulp.dest(dist.img))
            .pipe(browserSync.stream({
                once: true
            }))
    }

    function imagesPng() {
        return gulp.src(src.imgPng, {
                allowEmpty: true
            })
            .pipe(changed(dist.img, {
                hasChanged: changed.compareLastModifiedTime
            }))
            .pipe(gulpPngquant({
                quality: '65-80'
            }))
            .pipe(gulp.dest(dist.img))
            .pipe(browserSync.stream({
                once: true
            }))
    }

    function svgs() {
        return gulp.src(src.svg, {
                allowEmpty: true
            })
            .pipe(changed(dist.svg, {
                hasChanged: changed.compareLastModifiedTime
            }))
            .pipe(svgmin())
            .pipe(gulp.dest(dist.svg))
            .pipe(browserSync.stream({
                once: true
            }))
    }

    function fonts() {
        return gulp.src(src.fonts, {
                allowEmpty: true
            })
            .pipe(changed(dist.fonts, {
                hasChanged: changed.compareLastModifiedTime
            }))
            .pipe(fontmin())
            .pipe(gulp.dest(dist.fonts))
            .pipe(browserSync.stream({
                once: true
            }))
    }

    function docs() {
        return gulp.src(dist.docs, {
                allowEmpty: true
            })
            .pipe(changed(dist.docs, {
                hasChanged: changed.compareLastModifiedTime
            }))
            .pipe(gulp.dest(dist.docs))
            .pipe(browserSync.stream({
                once: true
            }))
    }

    function favicons() {
        return gulp.src(dist.favicons, {
                allowEmpty: true
            })
            .pipe(changed(dist.favicons, {
                hasChanged: changed.compareLastModifiedTime
            }))
            .pipe(gulp.dest(dist.favicons))
            .pipe(browserSync.stream({
                once: true
            }))
    }
    // Generate & inline critical-path CSS
    function critical() {
        return gulp.src(dist.pages + '/*' + fileExt)
            .pipe(critical({
                base: dist.pages,
                inline: true,
                css: config.criticalCss,
                width: 1300,
                height: 900
            }))
            .on('error', function (err) {
                gutil.log(gutil.colors.red(err.message));
            })
            .pipe(gulp.dest(dist.pages));
    }

    function bsReload() {
        return gulp.src(dist.pages)
            .pipe(browserSync.stream({
                once: true
            }))
    }

    function watch() {
        gulp.watch(src.pages, gulp.series(nunjucksPages));
        gulp.watch(src.templates, gulp.series(nunjucksTemplates));
        gulp.watch(config.pagesWatch, gulp.series(htmlInjector));
        gulp.watch(src.scss, gulp.series('styles'));
        gulp.watch(src.js, gulp.series('scripts'));
        gulp.watch(src.img, gulp.series('images'));
        gulp.watch(src.imgPng, gulp.series('imagesPng'));
        gulp.watch(src.svg, gulp.series('svgs'));
        gulp.watch(src.fonts, gulp.series('fonts'));
        gulp.watch(src.favicons, gulp.series('favicons'));
        gulp.watch(src.docs, gulp.series('docs'));
    }

    // Use CommonJS 'exports' module notation to declare tasks
    exports.nunjucksPages = nunjucksPages;
    exports.nunjucksTemplates = nunjucksTemplates;
    exports.styles = styles;
    exports.scripts = scripts;
    exports.images = images;
    exports.imagesPng = imagesPng;
    exports.svgs = svgs;
    exports.fonts = fonts;
    exports.favicons = favicons;
    exports.docs = docs;
    exports.bs = bs;
    exports.watch = watch;
    exports.bsReload = bsReload;

    // Runs all the required tasks (in order), launches browser sync, and watches for changes
    var build = gulp.series(clean, gulp.parallel(nunjucksPages, styles, images, imagesPng, svgs, fonts, docs, favicons));
    var run = gulp.parallel(bs, watch);

    gulp.task('clean', gulp.series(clean));
    gulp.task('default', gulp.series(build, run));

}());
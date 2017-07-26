var
  gulp         = require('gulp'),                       //  Gulp
  browserSync  = require('browser-sync'),               //  Для hot-reload
  stylus       = require('gulp-stylus'),                //  Компилирует STYLUS
  concat       = require('gulp-concat'),                //  Объединяет файлы
  uglify       = require('gulp-uglifyjs'),              //  Минифицирует js
  csso         = require('gulp-csso'),                  //  Минифицирует css
  del          = require('del'),                        //  Удаляет файлы
  imagemin     = require('gulp-imagemin'),              //  Минифицирует изображения
  imageminJR   = require('imagemin-jpeg-recompress'),   //  Доп. минификация JPEG
  Pngquant     = require('imagemin-pngquant'),          //  Доп. минификация PNG
  autoprefixer = require('gulp-autoprefixer'),          //  Подставляет префиксы для css
  uncss        = require('gulp-uncss'),                 //  Отсеивает неиспользуемые стили
  babel        = require('gulp-babel'),                 //  Транспилирует ES6 в ES3
  htmlmin      = require('gulp-html-minifier'),         //  Минифицирует HTML
  rigger       = require('gulp-rigger'),                //  Импортирует файлы
  replace      = require('gulp-replace');               //  Для версионирования


gulp.task('browser-sync', function() {
  browserSync({
    server: { baseDir: 'app' },
    notify: false
  });
});

gulp.task('main.css', function() {
  return gulp
    .src('app/styl/main.styl')
    .pipe(stylus())
    .pipe(gulp.dest('app/css/'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('vendor.css', function() {
  return gulp
    .src('app/libs/**/*.css')
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('app/css/'));
});

gulp.task('main.js', function() {
  return gulp
    .src('app/js/modules/main.js')
    .pipe(rigger())
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(gulp.dest('app/js/'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('vendor.js', function() {
  return gulp
    .src('app/libs/**/*.js')
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('app/js/'));
});


gulp.task('clear', function() {
  return del.sync('dist');
});

gulp.task('css', ['main.css', 'vendor.css'], function() {
  return gulp
    .src('app/css/*.css')
    .pipe(replace(/{ver}/g, Date.now()))
    // .pipe(uncss({ html: ['app/**/*.html'], ignore: ['error'] }))
    .pipe(autoprefixer(['last 20 versions', '> 1%', 'ie 8', 'ie 7']))
    .pipe(csso())
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('js', ['main.js', 'vendor.js'], function() {
  return gulp
    .src('app/js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('php', function() {
  return gulp
    .src('app/php/**/*')
    .pipe(gulp.dest('dist/php/'));
});

gulp.task('fonts', function() {
  return gulp
    .src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts/'));
});

gulp.task('img', function() {
  return gulp
    .src('app/img/*')
    .pipe(gulp.dest('dist/img/'))
    .pipe(imagemin([
      imageminJR({ progressive: true, max: 80, min: 70 }),
      Pngquant({quality: '80'})
    ]))
    .pipe(gulp.dest('dist/img/'));
});

gulp.task('html', function() {
  return gulp
    .src('app/*.html')
    .pipe(rigger())
    .pipe(replace(/{ver}/g, Date.now()))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('static', function() {
  return gulp
    .src(['app/static/**/*', 'app/*.*'])
    .pipe(gulp.dest('dist/'));
});

gulp.task('favicons', function() {
  return gulp
    .src('app/favicons/**/*')
    .pipe(gulp.dest('dist/favicons/'));
});

gulp.task('default', ['browser-sync', 'main.css', 'vendor.css', 'main.js', 'vendor.js'], function() {
  gulp.watch('app/styl/**/*.styl', ['main.css']);
  gulp.watch('app/js/modules/*.js', ['main.js']);
  gulp.watch('app/*.html', browserSync.reload);
});

gulp.task('build', ['clear', 'css', 'js', 'fonts', 'php', 'img', 'html', 'static', 'favicons']);

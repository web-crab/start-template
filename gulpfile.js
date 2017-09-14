const
    gulp         = require('gulp'),
    browserSync  = require('browser-sync'),             //  Для hot-reload
    stylus       = require('gulp-stylus'),              //  Компилирует stylus
    concat       = require('gulp-concat'),              //  Объединяет файлы
    uglify       = require('gulp-uglify'),              //  Минифицирует js
    csso         = require('gulp-csso'),                //  Минифицирует css
    del          = require('del'),                      //  Удаляет файлы
    imagemin     = require('gulp-imagemin'),            //  Минифицирует изображения
    imageminJR   = require('imagemin-jpeg-recompress'), //  Доп. минификация JPEG
    Pngquant     = require('imagemin-pngquant'),        //  Доп. минификация PNG
    autoprefixer = require('gulp-autoprefixer'),        //  Подставляет префиксы для css
    uncss        = require('gulp-uncss'),               //  Отсеивает неиспользуемые стили
    babel        = require('gulp-babel'),               //  Транспилирует ES6 в ES3
    rigger       = require('gulp-rigger'),              //  Импортирует файлы
    replace      = require('gulp-replace'),             //  Для версионирования
    header       = require('gulp-header'),              //  Добавляет текст в начало файла
    footer       = require('gulp-footer'),              //  Добавляет текст в конец файла    
    sourcemaps   = require('gulp-sourcemaps'),          //  Исходные файлы в браузере после минификации
    path         = require('path'),                     //  Модуль node.js для работы с путями
    ftp          = require('vinyl-ftp'),                //  FTP-соединение
    gutil        = require('gulp-util');                //  Набор утилит, используется при деплое
    

gulp.task('browser-sync', () => {
    browserSync({ server: { baseDir: 'dist' }, notify: false });
});


gulp.task('html',  () => {
    gulp.src('app/*.html')
        .pipe(rigger())
        .pipe(replace(/{ver}/g, Date.now()))        
        .pipe(gulp.dest('dist/'))
        .pipe(browserSync.reload({ stream: true }));
});


gulp.task('main.css', () => {
    gulp.src('app/styl/**/*')
        .pipe(stylus())
        .pipe(concat('main.css'))
        .pipe(sourcemaps.init())
        .pipe(replace(/{ver}/g, Date.now()))
        .pipe(autoprefixer(['last 20 versions', '> 1%', 'ie 8', 'ie 7']))
        .pipe(csso())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/css/'))
        .pipe(browserSync.reload({ stream: true }));
});


gulp.task('vendor.css', () => {
    gulp.src('app/libs/**/*.css')
        .pipe(concat('vendor.css'))
        .pipe(csso())
        .pipe(gulp.dest('dist/css/'));
});


gulp.task('main.js', () => {
    gulp.src('app/js/**/*')
        .pipe(concat('main.js'))
        .pipe(sourcemaps.init())        
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(uglify())
        .pipe(header('document.addEventListener("DOMContentLoaded", function() {'))
        .pipe(footer('});'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js/'))
        .pipe(browserSync.reload({ stream: true }));
});


gulp.task('vendor.js', () => {
    gulp.src('app/libs/**/*.js')
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js/'));
});


gulp.task('img', () => {
    del.sync('dist/img');
    gulp.src('app/img/**')
        .pipe(imagemin([imageminJR({ progressive: true, max: 80, min: 70 }), Pngquant({ quality: '80' })]))
        .pipe(gulp.dest('dist/img/'));
});


gulp.task('move', () => {
    del.sync('dist/favicons');    
    del.sync('dist/fonts');    
    del.sync('dist/php');
    gulp.src([
        '!app/*.html',  
        '!app/{img,img/**}',
        '!app/{include,include/**}',
        '!app/{js,js/**}',
        '!app/{libs,libs/**}',
        '!app/{styl,styl/**}',
        'app/**',
        'app/.htaccess'        
    ]).pipe(gulp.dest('dist/'));
});


gulp.task('default', ['html', 'main.css', 'vendor.css', 'main.js', 'vendor.js', 'img', 'move', 'browser-sync'], () => {
    gulp.watch('app/styl/**/*', ['main.css']);
    gulp.watch('app/libs/**/*.css', ['vendor.css']);
    gulp.watch('app/js/**/*', ['main.js']);
    gulp.watch('app/libs/**/*.js', ['vendor.js']);
    gulp.watch('app/**/*.html', ['html']);
    gulp.watch('app/img/**/*', ['img']);    
    gulp.watch(['app/favicons/**/*', 'app/fonts/**/*', 'app/php/**/*'], ['move']);    

    const delWatcherRootFiles = gulp.watch(['!app/*.html', 'app/*.*'], ['move']);
    delWatcherRootFiles.on('change', event => {
        if (event.type === 'deleted') del.sync(path.resolve('dist', path.relative(path.resolve('app'), event.path)));
    });
});


gulp.task('ftp', () => {
    const connect = ftp.create({
        host: '',
        user: '',
        pass: '',
        log: gutil.log
    });
    gulp.src('dist/**', { base: '.', buffer: false })
        .pipe(conn.newer('/'))
        .pipe(gutil.noop());
});
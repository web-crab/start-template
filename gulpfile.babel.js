import gulp    from 'gulp'
import gutil   from 'gulp-util'                //  Набор утилит, используется при деплое
import bSync   from 'browser-sync'             //  Сервер для разработки
import changed from 'gulp-changed'             //  Отсеивает файлы без именений

import rigger  from 'gulp-rigger'              //  Импортирует файлы
import concat  from 'gulp-concat'              //  Объединяет файлы
import del     from 'del'                      //  Удаляет файлы
import path    from 'path'                     //  Модуль для работы с путями

import replace from 'gulp-replace'             //  Замена текста в файле по regExp
import header  from 'gulp-header'              //  Добавляет текст в начало файла
import footer  from 'gulp-footer'              //  Добавляет текст в конец файла  

import stylus  from 'gulp-stylus'              //  Компилирует stylus
import prefix  from 'gulp-autoprefixer'        //  Подставляет вендорные префиксы
import csso    from 'gulp-csso'                //  Минифицирует css

import babel   from 'gulp-babel'               //  Транспилирует ES6 в ES5
import uglify  from 'gulp-uglify'              //  Минифицирует js
import srcmaps from 'gulp-sourcemaps'          //  Исходные файлы в браузере после минификации

import imgmin  from 'gulp-imagemin'            //  Минифицирует изображения
import jpgrec  from 'imagemin-jpeg-recompress' //  Доп. минификация JPEG
import pngrec  from 'imagemin-pngquant'        //  Доп. минификация PNG

import ftp     from 'vinyl-ftp'                //  FTP-соединение
import { host, user, pass }  from './ftp'      //  Доступ к FTP


//  CallBack для синхронизации удаления файлов
const delSync = event => {
    if (event.type === 'deleted') {
        del.sync(path.resolve('dist', path.relative(path.resolve('app'), event.path)))
    }
}

//  Папки и файлы, в которых нужно отслеживать добавление и удаление 
const globeRestFiles = [
    '!app/{favicons,favicons/**}',
    '!app/{fonts,fonts/**}',
    '!app/{img,img/**}',
    '!app/{include,include/**}',
    '!app/{js,js/**}',
    '!app/{libs,libs/**}',
    '!app/{php,php/**}',        
    '!app/{styl,styl/**}',
    '!app/*.html',  
    'app/**',
    'app/.htaccess'        
]


//  Задачи
gulp.task('browser-sync', () => bSync.init({ server: { baseDir: "dist" }, notify: false }))

gulp.task('favicons', () => gulp.src('app/favicons/**').pipe(changed('dist/favicons')).pipe(gulp.dest('dist/favicons')))
gulp.task('fonts', () => gulp.src('app/fonts/**').pipe(changed('dist/fonts')).pipe(gulp.dest('dist/fonts')))
gulp.task('php', () => gulp.src('app/php/**').pipe(changed('dist/php')).pipe(gulp.dest('dist/php')))
gulp.task('restFiles', () => gulp.src(globeRestFiles).pipe(changed('dist/')).pipe(gulp.dest('dist/')))

gulp.task('html',  () => {
    gulp.src('app/*.html')
        .pipe(rigger())
        .pipe(replace(/{ver}/g, Date.now()))        
        .pipe(gulp.dest('dist/'))
        .pipe(bSync.reload({ stream: true }))
})

gulp.task('main.css', () => {
    gulp.src('app/styl/**/*')
        .pipe(stylus())
        .pipe(concat('main.css'))
        .pipe(srcmaps.init())
        .pipe(replace(/{ver}/g, Date.now()))
        .pipe(prefix(['last 20 versions', '> 1%', 'ie 8', 'ie 7']))
        .pipe(csso())
        .pipe(srcmaps.write())
        .pipe(gulp.dest('dist/css/'))
        .pipe(bSync.reload({ stream: true }))
})

gulp.task('vendor.css', () => {
    gulp.src('app/libs/**/*.css')
        .pipe(concat('vendor.css'))
        .pipe(csso())
        .pipe(gulp.dest('dist/css/'))
})

gulp.task('main.js', () => {
    gulp.src('app/js/**/*')
        .pipe(concat('main.js'))
        .pipe(srcmaps.init())        
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(uglify())
        .pipe(header('document.addEventListener("DOMContentLoaded", function() {'))
        .pipe(footer('});'))
        .pipe(srcmaps.write())
        .pipe(gulp.dest('dist/js/'))
        .pipe(bSync.reload({ stream: true }))
})

gulp.task('vendor.js', () => {
    gulp.src('app/libs/**/*.js')
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js/'))
})

gulp.task('img', () => {
    gulp.src('app/img/**')
        .pipe(imgmin([jpgrec({ progressive: true, max: 80, min: 70 }), pngrec({ quality: '80' })]))
        .pipe(gulp.dest('dist/img/'))
})

gulp.task('ftp', () => {
    const connect = ftp.create({ host, user, pass, log: gutil.log})
    gulp.src('dist/**', { base: '.', buffer: false })
        .pipe(connect.newer('/'))
        .pipe(gutil.noop())
})

gulp.task('default', ['favicons', 'fonts', 'restFiles', 'html', 'main.css', 'vendor.css', 'main.js', 'vendor.js', 'img', 'browser-sync'], () => {
    gulp.watch('app/**/*.html', ['html'])
    gulp.watch('app/styl/**/*', ['main.css'])
    gulp.watch('app/libs/**/*.css', ['vendor.css'])
    gulp.watch('app/js/**/*', ['main.js'])
    gulp.watch('app/libs/**/*.js', ['vendor.js'])
    gulp.watch('app/img/**/*', ['img']).on('change', delSync)
    gulp.watch('app/favicons/**/*', ['favicons']).on('change', delSync)
    gulp.watch('app/fonts/**/*', ['fonts']).on('change', delSync)
    gulp.watch('app/php/**/*', ['php']).on('change', delSync)
    gulp.watch(globeRestFiles, ['restFiles']).on('change', delSync)
})
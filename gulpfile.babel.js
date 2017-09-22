import gulp    from 'gulp'
import gutil   from 'gulp-util'                //  Набор утилит, используется при деплое
import bSync   from 'browser-sync'             //  Сервер для разработки
import changed from 'gulp-changed'             //  Отсеивает файлы без именений

import include from 'gulp-include'             //  Импортирует файлы
import concat  from 'gulp-concat'              //  Объединяет файлы
import del     from 'del'                      //  Удаляет файлы
import path    from 'path'                     //  Модуль для работы с путями

import replace from 'gulp-replace'             //  Замена текста в файле по regExp
import header  from 'gulp-header'              //  Добавляет текст в начало файла
import footer  from 'gulp-footer'              //  Добавляет текст в конец файла

import stylus  from 'gulp-stylus'              //  Компилирует stylus
import uncss   from 'gulp-uncss'               //  Отсеивает неиспользуемые стили
import prefix  from 'gulp-autoprefixer'        //  Подставляет вендорные префиксы
import csso    from 'gulp-csso'                //  Минифицирует css

import babel   from 'gulp-babel'               //  Транспилирует ES6 в ES5
import uglify  from 'gulp-uglify'              //  Минифицирует js
import srcmaps from 'gulp-sourcemaps'          //  Исходные файлы в браузере после минификации

import imgmin  from 'gulp-imagemin'            //  Минифицирует изображения
import jpgrec  from 'imagemin-jpeg-recompress' //  Доп. минификация JPEG
import pngrec  from 'imagemin-pngquant'        //  Доп. минификация PNG
import svgmin  from 'gulp-svgmin'              //  Минификация SVG
import sprite  from 'gulp-svgstore'            //  Объединение SVG в спрайт

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
    '!app/img/{svg,svg/**}',    
    '!app/{include,include/**}',
    '!app/{js,js/**}',
    '!app/{libs,libs/**}',
    '!app/{php,php/**}',        
    '!app/{styl,styl/**}',
    '!app/*.html',  
    'app/**'
]


//  Задачи
gulp.task('browser-sync', () => bSync.init({ server: { baseDir: "dist" }, notify: false }))

gulp.task('favicons', () => gulp.src('app/favicons/**').pipe(changed('dist/favicons')).pipe(gulp.dest('dist/favicons')))
gulp.task('fonts', () => gulp.src('app/fonts/**').pipe(changed('dist/fonts')).pipe(gulp.dest('dist/fonts')))
gulp.task('php', () => gulp.src('app/php/**').pipe(changed('dist/php')).pipe(gulp.dest('dist/php')))
gulp.task('restFiles', () => gulp.src(globeRestFiles, { dot: true }).pipe(changed('dist/')).pipe(gulp.dest('dist/')))

gulp.task('html', () => {
    gulp.src('app/*.html')
        .pipe(include())
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
        // .pipe(uncss({ html: ['app/**/*.html'], ignore: ['error'] }))
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
        .pipe(babel({ presets: ['env'] }))
        .pipe(uglify())
        .pipe(header('(function(window, document){document.addEventListener("DOMContentLoaded", function() {'))
        .pipe(footer('})})(window, document);'))
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
    gulp.src(['app/img/**', '!app/img/{svg,svg/**}'])
        .pipe(imgmin([jpgrec({ progressive: true, max: 80, min: 70 }), pngrec({ quality: '80' })]))
        .pipe(gulp.dest('dist/img/'))
})

gulp.task('svg', () => {
    gulp.src('app/img/svg/**')
        .pipe(svgmin({
            plugins: [
                { removeAttrs: { attrs: '(fill|stroke|style)' } },
                { removeDimensions: true }
            ]
        }))
        .pipe(sprite({ inlineSvg: true }))
        .pipe(replace(/<svg /g, '<svg style="display:none" '))
        .pipe(require('through2').obj(file => {
            gulp.src('app/*.html')
                .pipe(include())
                .pipe(replace(/<body>/g, ('<body>' + file.contents.toString())))
                .pipe(gulp.dest('dist'))
        }))
        .pipe(bSync.reload({ stream: true }))
})

gulp.task('ftp', () => {
    const connect = ftp.create({ host, user, pass, log: gutil.log})
    gulp.src('dist/**', { base: '.', buffer: false })
        .pipe(connect.newer('/'))
        .pipe(gutil.noop())
})

gulp.task('default', ['img', 'html', 'favicons', 'fonts', 'restFiles',  'main.css', 'vendor.css', 'main.js', 'vendor.js', 'svg', 'browser-sync'], () => {
    gulp.watch('app/**/*.html', ['html'])
    gulp.watch('app/styl/**/*', ['main.css'])
    gulp.watch('app/libs/**/*.css', ['vendor.css'])
    gulp.watch('app/js/**/*', ['main.js'])
    gulp.watch('app/libs/**/*.js', ['vendor.js'])
    gulp.watch(['app/img/**/*', '!app/img/{svg,svg/**}'], ['img']).on('change', delSync)
    gulp.watch('app/img/svg/**', ['svg'])   
    gulp.watch('app/favicons/**/*', ['favicons']).on('change', delSync)
    gulp.watch('app/fonts/**/*', ['fonts']).on('change', delSync)
    gulp.watch('app/php/**/*', ['php']).on('change', delSync)
    gulp.watch(globeRestFiles, { dot: true }, ['restFiles']).on('change', delSync)
})
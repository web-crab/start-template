import gulp, { src, dest } from 'gulp'
import { argv } from 'yargs'                   //  Получает аргументы из командной строки
import fs      from 'fs'                       //  Модуль работы с файловой системой
import gutil   from 'gulp-util'                //  Набор утилит, используется при деплое
import bSync   from 'browser-sync'             //  Сервер для разработки

import sync    from 'run-sequence'             //  Синхронный запуск тасков
sync.options.ignoreUndefinedTasks = true

import include from 'gulp-include'             //  Импортирует файлы
import newer   from 'gulp-newer'               //  Оставляет только новые файлы в потоке
import concat  from 'gulp-concat'              //  Объединяет файлы
import { sync as del } from 'del'              //  Удаляет файлы

import htmlmin from 'gulp-htmlmin'             //  Минификация html

import replace from 'gulp-replace'             //  Замена текста в файле по regExp
import header  from 'gulp-header'              //  Добавляет текст в начало файла
import footer  from 'gulp-footer'              //  Добавляет текст в конец файла
import srcmaps from 'gulp-sourcemaps'          //  Исходные файлы в браузере после минификации

import stylus  from 'gulp-stylus'              //  Компилирует stylus
import uncss   from 'gulp-uncss'               //  Отсеивает неиспользуемые стили
import prefix  from 'gulp-autoprefixer'        //  Подставляет вендорные префиксы
import csso    from 'gulp-csso'                //  Минифицирует css
import font64  from 'gulp-simplefont64'        //  Конвертирует шрифты в base64 и генерирует @font-face

import babel   from 'gulp-babel'               //  Транспилирует ES6 в ES5
import uglify  from 'gulp-uglify'              //  Минифицирует js

import imgmin  from 'gulp-imagemin'            //  Минифицирует изображения
import jpgrec  from 'imagemin-jpeg-recompress' //  Доп. минификация JPEG
import pngrec  from 'imagemin-pngquant'        //  Доп. минификация PNG
import svgmin  from 'gulp-svgmin'              //  Минификация SVG
import sprite  from 'gulp-svgstore'            //  Объединение SVG в спрайт

import favicon from 'gulp-real-favicon'        //  Генерирует все иконки и создает manifest.json
import swCache from 'sw-precache'              //  Создает service-worker
import ftp     from 'vinyl-ftp'                //  FTP-соединение
import rev     from 'gulp-res-version'         //  Ревизия файлов

//  Импортируем настройки
import { appConfig, ftpData, html, htaccess } from './config'

//  Получаем аргументы из командной строки
const isBuild = argv.b || false             //  -b (Сборка в продакшен)
const sendFTP = isBuild && argv.f || false  //  -b -f (Отправка на сервер по FTP)

/**
 * Конфигурации тасков
 * name - имя таска
 * watchPath - путь для отслеживания изменений
 * body() - тело таска
 */
const tasks = [
    {
        //  Шрифты конвертируем в base64, и генерируем fonts.css
        name: 'fonts.css',
        watchPath: 'app/fonts/**',
        body() {
            return src('app/fonts/**')
            .pipe(font64())
            .pipe(concat('fonts.css'))
            .pipe(dest('dist/css'))
        }
    },
    {
        //  Компилируем стили, генерируем и минифицируем в main.css
        name: 'main.css',
        watchPath: 'app/styl/**',
        body() {
            return src('app/styl/**')
            .pipe(srcmaps.init())            
            .pipe(stylus())
            .pipe(concat('main.css'))
            // .pipe(uncss({ html: ['app/**/*.html'], ignore: ['error'] }))
            .pipe(prefix(['last 20 versions', '> 1%', 'ie 8', 'ie 7']))
            .pipe(csso())
            .pipe(srcmaps.write())
            .pipe(dest('dist/css'))
        }
    },
    {
        //  Объединяем стили библиотек, генерируем и минифицируем в libs.css
        name: 'libs.css',
        watchPath: 'app/libs/**/*.css',
        body() {
            return src('app/libs/**/*.css')
            .pipe(concat('libs.css'))
            .pipe(csso())
            .pipe(dest('dist/css'))
        }
    },
    {
        //  Транспилируем скрипты, объединяем, обворачиваем в FFIE и минифицируем в main.js
        name: 'main.js',
        watchPath: 'app/js/**',
        body() {
            return src('app/js/**')
            .pipe(srcmaps.init())        
            .pipe(concat('main.js'))    
            .pipe(babel({ presets: ['env'] }))
            .pipe(uglify())
            .pipe(header('(function(){document.addEventListener("DOMContentLoaded", function() {'))
            .pipe(footer('})})();'))
            .pipe(srcmaps.write())
            .pipe(dest('dist/js'))
        }
    },
    {
        //  Объединяем скрипты библиотек и минифицируем в libs.js
        name: 'libs.js',
        watchPath: 'app/libs/**/*.js',
        body() {
            return src('app/libs/**/*.js')
            .pipe(concat('libs.js'))
            .pipe(uglify())
            .pipe(dest('dist/js'))
        }
    },
    {
        //  Минифицируем изображения
        name: 'img',
        watchPath: ['app/img/**', '!app/img/{svg_sprite,svg_sprite/**}'],
        body() {
            return src(['app/img/**', '!app/img/{svg_sprite,svg_sprite/**}'])
            .pipe(newer('dist/img'))
            .pipe(imgmin([
                jpgrec({ progressive: true, max: 80, min: 70 }),
                pngrec({ quality: [0.3, 0.5] }),
//                 svgmin()
            ])).pipe(dest('dist/img'))
        }
    },
    {
        //  У svg-файлов убираем лишние атрибуты, объединяем в спрайт и вставляем в html
        name: 'svg_sprite',
        watchPath: 'app/img/svg_sprite/**',
        body() {
            src('app/img/svg_sprite/**')
            .pipe(svgmin({
                plugins: [
                    { removeAttrs: { attrs: '(fill|stroke|style)' } },
                    { removeDimensions: true }
                ]
            }))
            .pipe(sprite({ inlineSvg: true }))
            .pipe(replace(/<svg /g, '<svg style="display:none" '))
            .pipe(require('through2').obj(file => {
                html.svgSprite = file.contents.toString()
                if (!isBuild) sync('html', bSync.reload)
            }))
        }
    },
   
    {
        //  Переносим php-скрипты
        name: 'php',
        watchPath:'app/php/**',
        body() {
            return src('app/php/**')
            .pipe(newer('dist/php'))
            .pipe(dest('dist/php'))
        }
    },
    {
        //  Переносим файлы
        name: 'files',
        watchPath: 'app/files/**',
        body() {
            return src('app/files/**')
            .pipe(newer('dist/files'))
            .pipe(dest('dist/files'))
        }
    },
    {
        //  Инклудим и минифицируем html
        name: 'html',
        watchPath: 'app/**/*.html',
        body() {
            const inHead = fs.readdirSync('dist/css').reduce((html, fileName) => {
                return html += `<link rel="stylesheet" href="css/${fileName}">`
            }, isBuild ? html.head : '')

            const inFoot = fs.readdirSync('dist/js').reduce((html, fileName) => {
                return html += `<script src="js/${fileName}"></script>`
            }, '')
            
            return src('app/*.html')
            .pipe(include())
            .pipe(replace(/<\/head>/g, `${inHead}</head>`))
            .pipe(replace(/<body>/g, `<body>${html.svgSprite}`))            
            .pipe(replace(/<\/body>/g, `${inFoot}</body>`))
            .pipe(htmlmin({
                collapseBooleanAttributes: true,
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true,
                conservativeCollapse: true,
                removeAttributeQuotes: true,
                removeComments: true,
                removeEmptyAttributes: true,
                removeOptionalTags: true,
                removeRedundantAttributes: true
            })).pipe(dest('dist'))
        }
    }
]


/**
 * Таски для продакшен-сборки
 */
const prodTasks = [
    {
        //  Генерация фавиконов
        name: 'favicons',
        body() {
            return favicon.generateFavicon({
                masterPicture: `app/favicon.${appConfig.faviconFormat}`,
                dest: 'dist',
                iconsPath: '',
                design: {
                    ios: { pictureAspect: 'backgroundAndMargin', backgroundColor: '#ffffff', margin: '0%', assets: { ios6AndPriorIcons: true, ios7AndLaterIcons: true, precomposedIcons: true, declareOnlyDefaultIcon: false }, appName: appConfig.appName },
                    desktopBrowser: {},
                    windows: { pictureAspect: 'noChange', backgroundColor: appConfig.color, onConflict: 'override', assets: { windows80Ie10Tile: true, windows10Ie11EdgeTiles: { small: false, medium: true, big: false, rectangle: false } }, appName: appConfig.appName },
                    androidChrome: { pictureAspect: 'shadow', themeColor: appConfig.bgColor, manifest: { name: appConfig.appName, startUrl: appConfig.startUrl, display: 'standalone', orientation: 'portrait', onConflict: 'override', declared: true }, assets: { legacyIcon: false, lowResolutionIcons: true } },
                    safariPinnedTab: { pictureAspect: 'blackAndWhite', threshold: 50, themeColor: appConfig.color }
                },
                settings: { compression: 5, scalingAlgorithm: 'Mitchell', errorOnImageTooSmall: false },
                markupFile: 'app/faviconData.json'
            }, () => del('app/faviconData.json'))
        }
    },
    {
        //  Создание файла для серверного кеширования и сжатия контента
        name: 'htaccess',
        body() {
            return fs.writeFile('dist/.htaccess', htaccess)            
        }
    },
    {
        //  Ревизия подключаемых файлов
        name: 'revision',
        body() {
            return src('dist/*.html')
            .pipe(rev())
            .pipe(dest('dist'))
        }
    },
    {
        //  Создание service-worker для кеширования сайта
        name: 'sw',
        body() {
            return swCache.write('dist/sw.js', {
                staticFileGlobs: ['dist/**/*'],
                stripPrefix: 'dist'
            })
        }
    }
]

/**
 * ==================================================================
 */

//  Регистрируем таски и вовращаем список их имен
const tasksNames = tasks.map(task => {
    gulp.task(task.name, task.body)
    return task.name
})

//  Регистрируем продакшен-таски и вовращаем список их имен
const prodTasksNames = prodTasks.map(task => {
    gulp.task(task.name, task.body)
    return task.name
})

//  DEV-режим | Запуск сервера и слежение за изменениями
function watch() {
    bSync.init({ server: { baseDir: "dist" }, notify: false })

    tasks.forEach(task => {
        gulp.watch(task.watchPath, () => {
            sync([task.name], (task.name !== 'svg_sprite') ? bSync.reload : null)
        })
    })
}

//  PROD-режим | Запуск продакшен-скриптов и отправка сайта на сервер
function build() {
    sync(...prodTasksNames, () => {
        if (sendFTP) {
            const { host, user, pass, path } = ftpData
            src('dist/**', { buffer: false })
            .pipe(ftp.create({ host, user, pass, log: gutil.log }).dest(path))
            .pipe(gutil.noop())
        }
    })
}

gulp.task('default', () => {
    if (isBuild) del('dist')
    sync(...tasksNames, isBuild ? build : watch)
})

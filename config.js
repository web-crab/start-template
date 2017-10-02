/**
 * Настройки сайта
 */
export const appConfig = {
    faviconFormat: 'png',   //  Формат фавиконки
    appName: 'Example',     //  Имя сайта - отображается при добавлении сайта на экран
    color: '#ffc107',       //  Основной цвет, в формате HEX в нижем регистре
    bgColor: '#ffffff',     //  Цвет фона, в формате HEX в нижем регистре
    startUrl: 'http://example.com'  //  Ссылка на корень сайта
}

/**
 * Данные для подключения по FTP
 */
export const ftpData = {
    host: '',
    user: '',
    pass: '',
    path: 'example.com/www/'    //  Путь до каталога, куда загружать сайт
}

/**
 * HTML-код, вставляется во все страницы сайта
 * svgSprite - формируется автоматически
 * head - набор необходимы мета-тегов, подключение фавиконов, регистрация serwice-worker
 */
export const html = {
    svgSprite: '',
    head: `
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta http-equiv="cleartype" content="on">
        <meta http-equiv="msthemecompatible" content="no"/>
        <meta http-equiv="imagetoolbar" content="no"/>
        <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
        <meta name="HandheldFriendly" content="True">
        <meta name="MobileOptimized" content="320">
        <meta name="format-detection" content="telephone=no">
        <meta name="format-detection" content="address=no">
        <meta name="msapplication-tap-highlight" content="no">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <link rel="apple-touch-icon" sizes="57x57" href="apple-touch-icon-57x57.png">
        <link rel="apple-touch-icon" sizes="60x60" href="apple-touch-icon-60x60.png">
        <link rel="apple-touch-icon" sizes="72x72" href="apple-touch-icon-72x72.png">
        <link rel="apple-touch-icon" sizes="76x76" href="apple-touch-icon-76x76.png">
        <link rel="apple-touch-icon" sizes="114x114" href="apple-touch-icon-114x114.png">
        <link rel="apple-touch-icon" sizes="120x120" href="apple-touch-icon-120x120.png">
        <link rel="apple-touch-icon" sizes="144x144" href="apple-touch-icon-144x144.png">
        <link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png">
        <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-180x180.png">
        <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
        <link rel="manifest" href="manifest.json">
        <link rel="mask-icon" href="safari-pinned-tab.svg" color="${appConfig.color}">
        <link rel="shortcut icon" href="favicon.ico">
        <meta name="apple-mobile-web-app-title" content="${appConfig.appName}">
        <meta name="application-name" content="${appConfig.appName}">
        <meta name="msapplication-TileColor" content="${appConfig.color}">
        <meta name="msapplication-TileImage" content="mstile-144x144.png">
        <meta name="msapplication-config" content="browserconfig.xml">
        <meta name="theme-color" content="${appConfig.bgColor}">"
        <!--[if IE]><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
        <script>(function(){if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js')})()</script>
    `
} 

/**
 * Содержимое файла .htaccess, сжатие и кеширование контента
 */
export const htaccess = `
    <IfModule mod_expires.c>
    ExpiresActive On
    ExpiresDefault "access 7 days"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/javascript "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType text/html "access plus 7 day"
    ExpiresByType text/x-javascript "access 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/x-icon "access 1 year"
    ExpiresByType application/x-shockwave-flash "access 1 year"
    </IfModule>

    <ifModule mod_headers.c>
    <filesMatch "\.(ico|pdf|flv|jpg|jpeg|png|gif|swf)$">
    Header set Cache-Control "max-age=2592000, public"
    </filesMatch>
    <filesMatch "\.(css|js)$">
    Header set Cache-Control "max-age=2592000, public"
    </filesMatch>
    <filesMatch "\.(xml|txt)$">
    Header set Cache-Control "max-age=172800, public, must-revalidate"
    </filesMatch>
    <filesMatch "\.(html|htm|php)$">
    Header set Cache-Control "max-age=172800, private, must-revalidate"
    </filesMatch>
    </ifModule>

    <IfModule mod_setenvif.c>
    BrowserMatch "MSIE" force-no-vary
    BrowserMatch "Mozilla/4.[0-9]{2}" force-no-vary
    </IfModule>
`
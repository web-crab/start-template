<?php

include("./_config.php");

/**
* Функция записи данных в таблицу БД
* $table - имя таблицы. Имена столбцов должны совпадать с атрибутами name у передаваемых полей
* $fields - $_POST-массив полей
*/
function addToDB($table, $fields) {

    $sql = "INSERT INTO $table SET";

    $i = 0;
    foreach($fields as $k => $v) {
        $i++;
        $sql .= " $k='$v'";
        if ($i != count($fields)) $sql .= ',';
    }

    $mysqli = new mysqli($host, $user, $pass, $db);
    $mysqli->set_charset('utf8');
    $mysqli->query($sql);
    $mysqli->close();

}

/**
* Функция отправки HTML-письма на почту
* $sbj - тема письма
* $msg - содержимое
*/
function sendMail($sbj, $msg) {

    $headers   = "Content-type: text/html; charset=utf-8\r\n";
    $headers  .= "From: <$from>\r\n";

    mail($to, $sbj, $msg, $headers);

}

/**
* Функция загрузки файлов на сервер, в папку php/files/. Возвращает список ссылок на загруженные файлы
* $filesList - $_FILES-массив файлов
*/
function uploadFiles($filesList) {

    $pathForLinks = "http://www.$domain/php/files";
    $linksList = [];

    foreach ($filesList["error"] as $key => $error) {
        if ($error == "0") {
            $tmp_name = $filesList["tmp_name"][$key];
            $name = str_replace(" ", "_", $filesList["name"][$key]);
            $name = basename($name);
            $linksList[$key] = "$pathForLinks/$name";
            
            move_uploaded_file($tmp_name, "./files/$name");
        }
    }   

    return $linksList;
}
  

?>
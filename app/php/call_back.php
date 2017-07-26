<?php

  $name  = $_POST["name"];
  $phone = $_POST["phone"];

  $to      = "aist.consult@yandex.ru";
  $subject = "Заказ звонка";
  $message = $name . " " . $phone;

  $headers  = "Content-type: text/html; charset=utf-8 \r\n";
  $headers .= "From: CallBack <call-back@aist-post.com>\r\n";

  mail($to, $subject, $message, $headers);

?>

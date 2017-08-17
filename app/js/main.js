'use strict';

(function () {

  //  Функции

  function scrollTo(idElem) {
    var elem = document.getElementById(idElem),
        offset = window.pageYOffset + elem.getBoundingClientRect().top;

    document.body.scrollTop = offset - 50;
  }

  function serialize(obj) {
    var result = '';
    Object.keys(obj).forEach(function (key) {
      return result += key + '=' + obj[key] + '&';
    });
    return result;
  }

  function sendAJAX(scriptName) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var callback = arguments[2];

    axios.post('/php/' + scriptName + '.php', serialize(data)).then(function (res) {
      console.log(res.data);
      callback();
    }).catch(function (error) {
      return console.error(error);
    });
  }
})();
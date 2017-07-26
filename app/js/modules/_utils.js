//  Функции

function scrollTo(idElem) {
  const
    elem = document.getElementById(idElem),
    offset = window.pageYOffset + elem.getBoundingClientRect().top;

    document.body.scrollTop = offset - 50;
}

function serialize(obj) {
  let result = '';
  Object.keys(obj).forEach(key => result += key + '=' + obj[key] + '&');
  return result;
}

function sendAJAX(scriptName, data = {}, callback) {
  axios
    .post('/php/' + scriptName + '.php', serialize(data))
    .then((res) => {
      console.log(res.data);
      callback();
    })
    .catch(error => console.error(error));
}

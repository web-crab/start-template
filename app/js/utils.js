//  Вспомогательные функции
function serialize(obj) {
    let result = '';
    Object.keys(obj).forEach(key => result += key + '=' + obj[key] + '&');
    return result;
}
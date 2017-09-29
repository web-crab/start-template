//  Функции

function scrollTo(idElem, offset) {
    const
        elem = document.getElementById(idElem),
        offsetTop = window.pageYOffset + elem.getBoundingClientRect().top;

    document.body.scrollTop = offsetTop - offset;
}

function serialize(obj) {
    let result = '';
    Object.keys(obj).forEach(key => result += key + '=' + obj[key] + '&');
    return result;
}
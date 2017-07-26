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
  //  Переключение вкладок на втором экране

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab')),
      contents = document.querySelectorAll('.content');

  tabs.forEach(function (tab) {
    return tab.addEventListener('click', function (event) {
      event.preventDefault();

      var id = tabs.indexOf(event.target);

      addClassToElem(tabs, id, 'active');
      addClassToElem(contents, id, 'active');
    });
  });

  function addClassToElem(array, id, className) {
    if (array[id] !== undefined) {
      var elemHasClass = false;

      array.forEach(function (elem) {
        if (elem.classList.contains(className)) {
          if (elem === array[id]) elemHasClass = true;else elem.classList.remove(className);
        }
      });

      if (!elemHasClass) array[id].classList.add(className);
    } else return;
  }
  //  Расчет стоимости

  var form_weight = document.getElementById('form_weight'),
      form_price = document.getElementById('form_price'),
      form_isCP = document.getElementById('isCP'),
      form_resultOfCalc = document.getElementById('resultOfCalc');

  var weigth = parseInt(form_weight.value),
      price = parseInt(form_price.value),
      isCP = false;

  form_weight.addEventListener('input', function (event) {
    weigth = parseInt(event.target.value) || 0;
    calcResult();
  });
  form_price.addEventListener('input', function (event) {
    price = parseInt(event.target.value) || 0;
    calcResult();
  });
  form_isCP.addEventListener('change', function (event) {
    isCP = !!event.target.checked;
    calcResult();
  });

  function calcResult() {

    if (weigth > 100) return alert('Максимальный вес - 100 кг!');
    if (price > 200000) return alert('Максимальная стоимость - 200 000 р!');

    if (weigth > 0) {
      var delTariffs = [{ min: 0, max: 1, price: 150 }, { min: 1, max: 2, price: 200 }, { min: 2, max: 3, price: 250 }, { min: 3, max: 4, price: 300 }, { min: 4, max: 5, price: 350 }, { min: 5, max: 10, price: 600 }, { min: 10, max: 15, price: 900 }, { min: 15, max: 20, price: 1200 }, { min: 20, max: 25, price: 1500 }, { min: 25, max: 30, price: 1800 }, { min: 30, max: 35, price: 2100 }, { min: 35, max: 40, price: 2400 }, { min: 40, max: 100, price: 5000 }],
          CPTariffs = [{ min: 0, max: 20000, percent: 5 }, { min: 20000, max: 100000, percent: 4 }, { min: 100000, max: 200000, percent: 3 }],
          delTariff = delTariffs.find(function (tariff) {
        return weigth > tariff.min && weigth <= tariff.max;
      }),
          CPTariff = CPTariffs.find(function (tariff) {
        return price > tariff.min && price <= tariff.max;
      }),
          moneyComiss = price * 0.1,
          CPComiss = isCP ? price * (CPTariff.percent / 100) : 0,
          result = parseInt(delTariff.price + moneyComiss + CPComiss);

      form_resultOfCalc.textContent = result + ' р*';
    } else form_resultOfCalc.textContent = '';
  }
  calcResult();
  //  Отправка формы обратного звонка

  var form = document.getElementById('calBackForm');

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var name = document.getElementById('name').value,
        phone = document.getElementById('phone').value;

    if (phone.length < 10) return alert('Проверьте правильность введенного номера телефона');

    sendAJAX('call_back', { name: name, phone: phone }, function () {
      return alert('Спасибо! Ожидайте звонка оператора.');
    });
  });
  //  ##  Форма регистрации

  //  Инициализация модального окна
  var modal = new tingle.modal({
    closeMethods: ['overlay', 'button', 'escape'],
    onOpen: function onOpen() {
      window.location.hash = '#regform';
    },
    onClose: function onClose() {
      window.location.hash = '';
    }
  }),
      modalContentWrap = document.getElementById('modal'),
      //  Обертка формы
  triggers = document.querySelectorAll('.openRegForm'); //  Кнопки открытия окна

  // Перемещаем форму из DOM в модалку
  modal.setContent(modalContentWrap.innerHTML);
  modalContentWrap.parentNode.removeChild(modalContentWrap);

  //  Кнопки открывают окно по клику
  triggers.forEach(function (trigger) {
    return trigger.addEventListener('click', function () {
      return modal.open();
    });
  });

  var formReg = document.getElementById('form_reg'),
      typeOfLoadFields = document.getElementsByName('typeOfLoad'); //  Радио баттоны "Вид груза"

  //  В зависимости от вида груза меняем поля формы
  typeOfLoadFields.forEach(function (elem) {
    return elem.addEventListener('change', function (event) {
      return toggleFields(event.target.value);
    });
  });

  formReg.addEventListener('submit', function (event) {
    event.preventDefault();
    var form_fields = [document.querySelector('[name="typeOfLoad"][checked]'), document.getElementById('name_pol'), document.getElementById('phone_pol'), document.getElementById('city_pol'), document.getElementById('name_otp'), document.getElementById('name_shop'), document.getElementById('number'), document.getElementById('cash_pay'), document.getElementById('item_name')],
        data = {},
        callback = function callback() {
      modal.close();
      alert('Отправление успешно зарегистрировано!');
    };

    var valid = true;

    form_fields.forEach(function (field) {
      if (field.id === 'name_pol' && !field.value || field.id === 'phone_pol' && field.value.length < 10) {

        field.classList.add('error');
        valid = false;
        return;
      } else {
        if (field.classList.contains('error')) field.classList.remove('error');
        data[field.id || 'type_of_load'] = field.value;
      }
    });

    if (valid) sendAJAX('reg', data, callback);
  });

  function toggleFields() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Посылка';

    var parcelFields = document.querySelectorAll('.for-parcel'),
        orderFields = document.querySelectorAll('.for-order');

    if (value === 'Посылка') {
      orderFields.forEach(function (elem) {
        return elem.style.display = 'none';
      });
      parcelFields.forEach(function (elem) {
        return elem.style.display = 'inherit';
      });
    } else {
      parcelFields.forEach(function (elem) {
        return elem.style.display = 'none';
      });
      orderFields.forEach(function (elem) {
        return elem.style.display = 'inherit';
      });
    }
  }
  toggleFields();
  if (window.location.hash === '#regform') modal.open();

  var btnDetails = document.getElementById('btn_details'),
      navLinks = document.querySelectorAll('.navLink');

  btnDetails.addEventListener('click', function () {
    scrollTo('services');
  });

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var to = link.getAttribute('href').slice(1);
      scrollTo(to);
    });
  });
})();
var purify = function () {
  $('form').addClass('pure-form');
  $('button').addClass('pure-button');
};

Template.atForm.rendered = purify;

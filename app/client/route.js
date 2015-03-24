(function () {

  'use strict';

  MeteorSettings.setDefaults({ public: {
    blog: { defaultLocale: "en" }
  }});

  Router.configure({
    layoutTemplate: 'mainLayout'
  });

  Router.map(function () {
    this.route('home', {
      path: '/',
      onAfterAction : function() {
        document.title = TAPi18n.__('site_title');
      }
    });
  });

})();

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

  Meteor.startup(function () {

    TAPi18n.setLanguage(Meteor.settings.public.blog.defaultLocale)
      .fail(function (error_message) {
        console.log(error_message);
      });
  });

})();

(function () {

  Router.configure({
    layoutTemplate: 'mainLayout'
  });

  Router.map(function () {
    this.route('home', {
      path: '/',
      onAfterAction : function() {
        document.title = 'Xolv.io Markdown Blog Sample Site';
      }
    });
  });

  Meteor.startup(function () {

    TAPi18n.setLanguage(Meteor.settings.public.blog.locale)
      .fail(function (error_message) {
        console.log(error_message);
      });
  });

})();

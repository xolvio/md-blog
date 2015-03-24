Meteor.startup(function () {

  Tracker.autorun(function() {

    T9n.setLanguage(Session.get('locale'));
  });

  Session.set('locale', Meteor.settings.public.blog.defaultLocale);
});

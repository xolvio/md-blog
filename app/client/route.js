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

})();
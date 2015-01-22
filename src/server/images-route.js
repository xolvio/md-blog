(function() {

  'use strict';

  function getImagePath () {
    var imagePath = Meteor.settings.public.blog.imagePath
    if (!imagePath) imagePath = '/img';

    // Remove any duplicate '/'
    return _.compact((imagePath + '/:slug').split('/')).join('/');
  }

  Router.route(getImagePath(), { where: 'server' })
    .get(function() {
      var file = Images.findOne({ slug: this.params.slug });
      if (file) {
        this.response.writeHead(200, {
          'Content-Type': file.type,
          'Content-Length': file.size
        });
        this.response.end(new Buffer(file.bytes));
      }
      else {
        this.render('not-found');
      }
    });

})();

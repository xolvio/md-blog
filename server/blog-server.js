(function () {

  'use strict';

  Meteor.publish('blog', function () {
    return Blog.find();
  });

})();
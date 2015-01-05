(function () {

  var blogSub = Meteor.subscribe('blog');

  Router.map(function () {
    this.route('blogList', {
      path: '/blog',
      layoutTemplate: 'blogListLayout',
      action: function () {
        this.wait(blogSub);
        this.render('blogList');
      },
      data: function () {
        var sort = Meteor.settings.public.blog.sortBy;
        return Blog.find({archived: false}, {sort: sort ? sort : {date: -1}});
      }
    });

    this.route('blogListArchive', {
      path: '/blog/archive',
      layoutTemplate: 'blogListLayout',
      action: function () {
        this.wait(blogSub);
        this.render('blogList');
      },
      data: function () {
        var sort = Meteor.settings.public.blog.sortBy;
        return Blog.find({archived: true}, {sort: sort ? sort : {date: -1}});
      }
    });

    this.route('blogPost', {
      path: '/blog/:shortId/:slug',
      layoutTemplate: 'blogPostLayout',
      action: function () {
        this.wait(blogSub);
        this.render('blogPost');
      },
      data: function () {
        if (this.ready()) {
          var blog = Blog.findOne({shortId: this.params.shortId});
          if (blog) {
            blog.loaded = true;
            return blog;
          }
          this.render('not-found')
        }
      }
    });

  });
})();
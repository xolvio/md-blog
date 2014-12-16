(function () {

  var blogSub = Meteor.subscribe('blog');

  Router.map(function () {
    this.route('blogList', {
      path: '/blog',
      layoutTemplate: 'blogListLayout',
      action: function () {
        this.wait(blogSub);
        this.render('blogList');
        // Next line added 12/16/14 Aaron Cammarata acammarata@voidalpha.com
        Session.set('mdblog-inPost', false);
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
        // Next line added 12/16/14 Aaron Cammarata acammarata@voidalpha.com
        Session.set('mdblog-inPost', false);
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
        // Next line added 12/16/14 Aaron Cammarata acammarata@voidalpha.com
        Session.set('mdblog-inPost', true);
      },
      data: function () {
        if (this.ready()) {
          var blog = Blog.findOne({slug: this.params.slug});
          if (blog) {
            blog.loaded = true;
            // Next line added 12/16/14 Aaron Cammarata acammarata@voidalpha.com
            Session.set('mdblog-inPost', true);
            return blog;
          }
          this.render('not-found')
        }
      }
    });

  });
})();
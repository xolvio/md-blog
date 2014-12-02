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
        return Blog.find({}, {sort: {order: -1}});
      },

      onAfterAction: function () {
        SEO.set({
          title: Meteor.settings.public.blog.name,
          meta: {
            'description': Meteor.settings.public.blog.description
          },
          og: {
            title: Meteor.settings.public.blog.name,
            'description': Meteor.settings.public.blog.description
          }
        });
      }

    });

    this.route('blogPost', {
      path: '/blog/:slug',
      layoutTemplate: 'blogPostLayout',


      action: function () {
        this.wait(blogSub);
        this.render('blogPost');
      },

      data: function () {
        if (this.ready()) {
          var blog = Blog.findOne({slug: this.params.slug});
          if (blog) {
            blog.loaded = true;
            return blog;
          }
        }
      },

      onAfterAction: function () {
        var post = this.data();
        SEO.set({
          title: post.title,
          meta: {
            'description': post.summary
          },
          og: {
            title: post.title,
            'description': post.summary
          }
        });
      }

    });


  });


})();
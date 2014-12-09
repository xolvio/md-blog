(function () {

  'use strict';

  Meteor.publish('blog', function () {
    if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
      return Blog.find();
    } else {
      return Blog.find({published: true});
    }
  });

  function _upsertBlogPost (blog) {
    blog.published = blog.published ? blog.published : false;
    blog.archived = blog.archived ? blog.archived : false;
    blog.slug = _replaceAll(' ', '-', blog.title.toLowerCase());

    // if no id was provided, this is a new blog entry so we should create an ID here to extract
    // a short ID before this blog is inserted into the DB
    var id = blog._id;
    if (!id) {
      id = new Meteor.Collection.ObjectID()._str;
    } else {
      delete blog._id;
    }
    blog.shortId = id.substring(0, 5);

    Blog.upsert(id, {$set: blog});
  }

  Meteor.methods({
    'upsertBlog': function (blog) {

      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        _upsertBlogPost(blog);
        return blog;

      } else {
        throw new Meteor.Error(403, "Not authorized to author blog posts");
      }
    },
    'deleteBlog': function (blog) {
      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        Blog.remove(blog._id);
      } else {
        throw new Meteor.Error(403, "Not authorized to author blog posts");
      }
    },
    'mdBlogCount': function() {
      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        return Blog.find().count();
      } else {
        return Blog.find({published: true}).count();
      }
    }
  });

  function _replaceAll (find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
  }


  Meteor.startup(function () {
    if (process.env.NODE_ENV === 'development') {
      Blog.remove({});
    }
    if (Blog.find().count() === 0) {
      _upsertBlogPost({
        published: true,
        archived: false,
        title: "Your blog is empty",
        author: 'Yours Truly',
        date: new Date().getTime(),
        summary: 'If you are the owner of this blog, you need to setup a couple of things before ' +
        'the blog will magically work.',
        content: Assets.getText('README.md')
      });
    }
  });


})();
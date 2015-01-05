(function () {

  'use strict';

  Meteor.publish('blog', function () {
    if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
      // Do not send the entire post history by default. This could be a large field that is
      // often not used during normal editing. Instead, we'll make it available via a Meteor.method
      // when the user requests it by clicking the History button. Sending the entire history for all
      // posts would be especially slow for the blog list template, which shows all blog posts.
      return Blog.find({}, {
        fields: {
          history: false
        }
      });
    } else {
      return Blog.find({published: true}, {
        fields: {
          history: false
        }
      });
    }
  });

  function _upsertBlogPost (blog) {
    blog.published = blog.published ? blog.published : false;
    blog.archived = blog.archived ? blog.archived : false;
    blog.slug = _getSlug(blog.title);
    blog.date = new Date(Date.now());

    // if no id was provided, this is a new blog entry so we should create an ID here to extract
    // a short ID before this blog is inserted into the DB
    var id = blog._id;
    if (!id) {
      id = new Meteor.Collection.ObjectID()._str;
    } else {
      delete blog._id;
    }
    blog.shortId = id.substring(0, 5);

    var blogCopy = Blog.findOne(id);

    if (blogCopy === undefined) {
      // It's a new post, so just upsert it
      Blog.upsert(id, {$set: blog});
    } else {
      /*
       * It's an existing post, so we need to handle history.
       * Push the current blog post onto the history stack,
       * then overwrite the current blog post with the new one.
       */
      // We don't want a copy of the existing history being saved into the history,
      // or it will spiral out of control
      delete blogCopy.history;

      // And we also don't want to store the id anywhere except at the top level
      delete blogCopy._id;

      Blog.upsert(id, {$push: {history: blogCopy}, $set: blog});
    }
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
    'mdBlogCount': function () {
      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        return Blog.find().count();
      } else {
        return Blog.find({published: true}).count();
      }
    },
    'mdblog-getHistory': function (blogId) {
      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        var blog = Blog.findOne(blogId);
        if (blog) {
          var results = blog.history;
          // Add the current post to the end of the list - it won't be in the history array
          var current = blog;
          delete current.history;
          delete current._id;
          results.push(current);
          return results;
        } else {
          return null;
        }
      } else {
        throw new Meteor.Error(403, "Not authorized to author blog posts");
      }
    },
    'mdblog-restoreVersion': function (blogId, versionNumber) {
      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        /*
         * Since any upsert automatically pushes the current version onto the history,
         * all we have to do is pluck the desired version from history and push it back on.
         * The trick is that we present them to the user in reverse-time order, so we need to count
         * from the back of the list.
         */
        var blogToRestore = Blog.findOne(blogId);
        var postToRestore = blogToRestore.history[blogToRestore.history.length - versionNumber];
        // NOTE! - posts in the history do NOT have an _id, so you need to re-add it, or else it will
        // upsert it as if it was the first attempt to save - completely overwriting the existing history.
        postToRestore._id = blogId;
        _upsertBlogPost(postToRestore);
        return Blog.findOne(blogId);
      } else {
        throw new Meteor.Error(403, "Not authorized to author blog posts");
      }
    },
    'mdblog-deleteVersion': function (blogId, versionNumber) {
      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        var blogHistory = Blog.findOne(blogId).history;
        blogHistory.splice(blogHistory.length - versionNumber, 1);
        Blog.update(blogId, {$set: {history: blogHistory}});
      } else {
        throw new Meteor.Error(403, "Not authorized to author blog posts");
      }
    }
  });

  function _getSlug (title) {

    var replace = [
      ' ', '#', '%', '"', ':', '/', '?',
      '^', '`', '[', ']', '{', '}', '<', '>',
      ';', '@', '&', '=', '+', '$', '|', ','
    ];

    var slug = title.toLowerCase();
    for (var i = 0; i < replace.length; i++) {
      slug = _replaceAll(replace[i], '-', slug);
    }
    return slug;
  }

  function _replaceAll (find, replace, str) {
    return str.replace(new RegExp('\\' + find, 'g'), replace);
  }


  Meteor.startup(function () {
    if (!!process.env.AUTO_RESET && process.env.NODE_ENV === 'development') {
      Blog.remove({});
    }
    if (Blog.find().count() === 0) {
      _upsertBlogPost({
        published: true,
        archived: false,
        title: "This Blog is not Setup Yet",
        author: 'John Doe',
        date: new Date().getTime(),
        summary: 'If you are the owner of this blog, you need to setup a couple of things before ' +
        'the blog will magically work.',
        content: Assets.getText('README.md')
      });
    }
  });


})();
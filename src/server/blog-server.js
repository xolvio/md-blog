(function () {

  'use strict';

  MeteorSettings.setDefaults({ public: {
    blog: { defaultLocale: "en" }
  }}, MeteorSettings.REQUIRED_IN_PROD);

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
    blog.slug = _getSlug(blog.title);

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

  function _sendEmail (blog) {

    var addresses = Meteor.users.find(
      { 'emails.address': { $ne: '' } } ).map(
      function(doc) { return doc.emails[0].address });

    console.info("Sending email for '" + blog.title + "' to "
      + addresses.length + ' recipient(s):', addresses);

    var sender = Meteor.user().emails[0].address;
    Email.send({
      to: sender,
      bcc: addresses,
      from: sender,
      subject: blog.title,
      html: SSR.render('publishEmail', {
        summary: blog.summary,
        url: getBlogPostUrl(blog),
        read_more: TAPi18n.__('read_more', {},
          Meteor.settings.public.blog.defaultLocale)
        })
    });
  }

  function _removePost (blog) { Blog.remove(blog._id); }

  var _authorRoleRequired = function (func) {
    return function(blog) {
      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        func(blog);
        return blog;
      } else {
        throw new Meteor.Error(403, "Not authorized");
      }
    }
  }

  Meteor.methods({
    'upsertBlog': _authorRoleRequired( _upsertBlogPost ),
    'sendEmail': _authorRoleRequired( _sendEmail ),
    'deleteBlog': _authorRoleRequired( _removePost ),
    'mdBlogCount': function () {
      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        return Blog.find().count();
      } else {
        return Blog.find({published: true}).count();
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
      var locale = Meteor.settings.public.blog.defaultLocale;
      _upsertBlogPost({
        published: true,
        archived: false,
        title: TAPi18n.__("blog_post_setup_title", null, locale),
        author: TAPi18n.__("blog_post_setup_author", null, locale),
        date: new Date().getTime(),
        summary: TAPi18n.__("blog_post_setup_summary", null, locale),
        content: TAPi18n.__("blog_post_setup_contents", null, locale)
      });
    }
  });

})();

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

  function _dataURItoBlob(dataURI) {
    if (dataURI.split(',')[0].indexOf('base64') < 0) {
      console.log('ERROR: unknown dataURI: ' + dataURI);
      return '';
    }
    var byteString = new Buffer(dataURI.split(',')[1], 'base64').toString('binary')
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return ia;
  }

  function _upsertImage(imageName, fileType, fileSize, file) {
    var slug = _getSlug(imageName);
    var bytes = _dataURItoBlob(file);
    if (bytes.length === 0) {
      return '';
    }
    console.log('Saving: slug=' + slug + ' size=' + fileSize + ' type=' + fileType);
    Images.update(
      { slug: slug },
      { slug: slug, name: imageName, type: fileType, size: fileSize, bytes: bytes },
      { upsert: true }
    );
    return slug;
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
    'upsertImage': function (imageName, fileType, fileSize, file) {

      if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
        return _upsertImage(imageName, fileType, fileSize, file);
      } else {
        throw new Meteor.Error(403, "Not authorized to upload images");
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
      Images.remove({});
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

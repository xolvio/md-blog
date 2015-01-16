(function () {

  var defaultBlogSettings = {
    "name": "Blog",
    "Description": "Blog posts.",
    "blogPath": "/blog",
    "archivePath": "/blog/archive",
    "useUniqueBlogPostsPath": true,
    "prettify": {
      "syntax-highlighting": true
    },
    "locale": "en"
  };

  if (!Meteor.settings || !Meteor.settings.public || !Meteor.settings.public.blog) {
    Meteor.settings = Meteor.settings || {};
    Meteor.settings.public = Meteor.settings.public || {};
    Meteor.settings.public.blog = defaultBlogSettings;
  } else {
    _.defaults(Meteor.settings.public.blog, defaultBlogSettings);
  }

  'use strict';

  // ***********************************************************************************************
  // **** Blog List

  Template.blogList.rendered = function () {
    _setMetadata({
      title: Meteor.settings.public.blog.name,
      description: Meteor.settings.public.blog.description
    });
  };

  var _setMetadata = function (meta) {
    if (meta.title) {
      document.title = meta.title;
      delete meta.title;
    }
    for (var key in meta) {
      $('meta[name="' + key + '"]').remove();
      $('head').append('<meta name="' + key + '" content="' + meta[key] + '">');

      $('meta[property="og:' + key + '"]').remove();
      $('head').append('<meta property="og:' + key + '" content="' + meta[key] + '">');

    }

  };

  Template.blogList.created = function () {
    var self = this;
    self.serverBlogCount = new ReactiveVar(false);
    this.autorun(function () {
      Meteor.call('mdBlogCount', function (err, serverBlogCount) {
        self.serverBlogCount.set(serverBlogCount);
      });
    });
  };

  Template.blogList.helpers({
    content: function () {
      return marked(this.summary);
    }
  });

  Template.blogList.events({
    'click #mdblog-new': _new
  });

  function _new () {
    if (!Meteor.user()) {
      this.render('not-found');
      return;
    }

    var author = Meteor.user().profile && Meteor.user().profile.name ? Meteor.user().profile.name : Meteor.user().emails[0].address;
    var newBlog = {
      title: TAPi18n.__("new_post_title"),
      date: new Date(),
      author: author,
      summary: _getRandomSummary(),
      content: TAPi18n.__("new_post_contents")
    };
    Meteor.call('upsertBlog', newBlog, function(err, blog) {
      if (!err) {
        Router.go('blogPost', blog);
      } else {
        console.log('Error upserting blog', err);
      }

    });

  }

  function _getRandomSummary () {
    var subjects = ['I', 'You', 'She', 'He', 'They', 'We'];
    var verbs = ['was just', 'will get', 'found', 'attained', 'received', 'will merge with', 'accept', 'accepted'];
    var objects = ['Billy', 'an apple', 'a force', 'the treasure', 'a sheet of paper'];
    var endings = ['.', ', right?', '.', ', like I said I would.', '.', ', just like your app!'];

    return subjects[Math.round(Math.random() * (
      subjects.length - 1))] + ' ' +
      verbs[Math.round(Math.random() * (verbs.length - 1))] + ' ' +
      objects[Math.round(Math.random() * (objects.length - 1))] +
      endings[Math.round(Math.random() * (endings.length - 1))];
  }

  // ***********************************************************************************************
  // **** Blog Post

  Template.blogPost.rendered = function () {
    if (this.data) {
      _setMetadata({
        title: this.data.title,
        description: this.data.summary
      });
    }
  };

  Template.blogPost.events({
    'click [contenteditable], focus *[contenteditable]': _edit,
    'keyup [contenteditable]': _update,
    'blur [contenteditable]': _stopEditing
  });

  Template.blogPost.helpers({
    blogPostReady: function () {
      return this.content;
    },
    content: function () {
      var $content = $('<p/>', {html: marked(this.content)});
      _prettify($content);
      return $content.html();
    },
    contenteditable: function () {
      if (UI._globalHelpers.isInRole('mdblog-author')) {
        return 'contenteditable'
      }
      return '';
    }
  });

  function _update (ev) {
    var $el = $(ev.currentTarget);
    Session.set('mdblog-modified', true);
    if (ev.keyCode == 27) {
      $el.blur();
      return;
    }
    $('#mdblog-publish').show();
    this[ev.currentTarget.id] = ev.currentTarget.innerText;
    if ($el.data('markdown')) {
      var $content = $('<p/>', {html: marked(this[ev.currentTarget.id])});
      _prettify($content);
      $('#mdblog-clone')[0].innerHTML = $content.html();
    }
  }

  function _edit (ev) {
    var $el = $(ev.currentTarget);
    if ($el.data('editing')) {
      return;
    }
    if ($el.data('markdown')) {
      var clone = $el.clone();
      $el.after(clone.attr('id', 'mdblog-clone'));
    }
    $el.addClass('editing');
    $el.data('editing', true);
    ev.currentTarget.innerText = this[ev.currentTarget.id];
  }

  function _stopEditing (ev) {
    var element = ev.currentTarget;
    var $el = $(element);
    $el.data('editing', false);
    $el.removeClass('editing');

    this[element.id] = element.innerText;
    if ($el.data('markdown')) {
      $('#mdblog-clone').remove();
      var $content = $('<p/>', {html: marked(this[ev.currentTarget.id])});
      _prettify($content);
      ev.currentTarget.innerHTML = $content.html();
    }
    // TODO save changes to this.draft.history.time.[field]
  }

  function _addSyntaxHighlighting (e) {
    var syntaxHighlighting = Meteor.settings.public.blog.prettify['syntax-highlighting'];
    if (syntaxHighlighting) {
      e.find('pre').each(function (i, block) {
        hljs.highlightBlock(block);
      });
    }
  }

  function _addClassesToElements (e) {
    var elementClasses = Meteor.settings.public.blog.prettify['element-classes'];
    if (elementClasses) {
      for (var i = 0; i < elementClasses.length; i++) {
        e.find(elementClasses[i].locator).each(function (idx, element) {
          var $elem = $(element);
          $elem.addClass(elementClasses[i].classes.join(' '));
        });
      }
    }
  }

  function _prettify (content) {
    if (Meteor.settings.public.blog.prettify) {
      _addSyntaxHighlighting(content);
      _addClassesToElements(content);
    }
  }

  // ***********************************************************************************************
  // **** Blog Controls

  Router.onAfterAction(function () {
    Session.set('mdblog-modified', false);
  });

  Template.blogControls.helpers({
    modified: function () {
      return Session.get('mdblog-modified');
    }
  });

  Template.blogControls.events({
    'click #mdblog-save': _save,
    'click #mdblog-publish': _publish,
    'click #mdblog-unpublish': _unpublish,
    'click #mdblog-archive': _archive,
    'click #mdblog-unarchive': _unarchive,
    'click #mdblog-delete': _delete
  });

  function _save () {
    if (this.published) {
      var userIsSure = confirm(TAPi18n.__("confirm_save_published"));
      if (!userIsSure) {
        return;
      }
    }
    Meteor.call('upsertBlog', this, function (err, blog) {
      if (!err) {
        Router.go('blogPost', blog);
        Session.set('mdblog-modified', false);
      }
    });
  }

  function _publish () {
    var userIsSure = confirm(TAPi18n.__("confirm_publish"));
    if (userIsSure) {
      this.published = true;
      Meteor.call('upsertBlog', this);
    }
  }

  function _unpublish () {
    var userIsSure = confirm(TAPi18n.__("confirm_unpublish"));
    if (userIsSure) {
      this.published = false;
      Meteor.call('upsertBlog', this);
    }
  }

  function _archive () {
    var userIsSure = confirm(TAPi18n.__("confirm_archive"));
    if (userIsSure) {
      this.archived = true;
      Meteor.call('upsertBlog', this);
    }
  }

  function _unarchive () {
    var userIsSure = confirm(TAPi18n.__("confirm_unarchive"));
    if (userIsSure) {
      this.archived = false;
      Meteor.call('upsertBlog', this);
    }
  }

  function _delete () {
    var input = prompt(TAPi18n.__("confirm_delete"));
    if (input === TAPi18n.__("confirm_delete_YES")) {
      Meteor.call('deleteBlog', this, function (e) {
        if (!e) {
          Router.go('blogList');
        }
      });
    }
  }

  UI.registerHelper('mdBlogElementClasses', function (type) {
    var elementClasses = Meteor.settings.public.blog.prettify['element-classes'];
    if (elementClasses) {
      for (var i = 0; i < elementClasses.length; i++) {
        if (elementClasses[i].locator === type) {
          return elementClasses[i].classes.join(' ');
        }
      }
    }
  });

  var localeDep = new Tracker.Dependency;

  UI.registerHelper('mdBlogDate', function (date) {
    localeDep.depend();
    return moment(date).calendar();
  });

  Meteor.startup(function() {
    var locale = Meteor.settings.public.blog.locale;
    TAPi18n.setLanguage(locale).done( function() {
      var momentConfig = $.parseJSON(TAPi18n.__("moment"));
      moment.locale(locale, momentConfig);
      localeDep.changed();
    });
  });

})();

(function () {

  var defaultBlogSettings = {
    "blogPath": "/blog",
    "archivePath": "/blog/archive",
    "useUniqueBlogPostsPath": true,
    "prettify": {
      "syntax-highlighting": true
    },
    "defaultLocale": "en"
  };

  if (!Meteor.settings || !Meteor.settings.public || !Meteor.settings.public.blog) {
    Meteor.settings = Meteor.settings || {};
    Meteor.settings.public = Meteor.settings.public || {};
    Meteor.settings.public.blog = defaultBlogSettings;
  } else {
    _.defaults(Meteor.settings.public.blog, defaultBlogSettings);
  }

  'use strict';


  var momentLocaleDep = new Tracker.Dependency;

  Meteor.startup(function() {

    var locale = Meteor.settings.public.blog.defaultLocale;
    Session.set('locale', locale);

    Tracker.autorun(function() {
      var locale = Session.get('locale');
      TAPi18n.setLanguage(locale).done( function() {
        var momentConfig = $.parseJSON(TAPi18n.__("moment"));
        moment.locale(locale, momentConfig);
        momentLocaleDep.changed();
      });
    });

    // Initialize versioning / history system
    Session.set("mdblog-show-history", false);
    Session.set("mdblog-history-list");

  });

  // ***********************************************************************************************
  // **** Blog List

  Template.blogList.rendered = function () {
    Tracker.autorun(function() {
      Session.get('locale'); // force dependency
      _setMetadata({
        title: TAPi18n.__("name"),
        description: TAPi18n.__("description")
      });
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
    'blur [contenteditable]': _stopEditing,
    'click #mdblog-history': _openHistory
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
  // **** History

  Template.blogHistory.helpers({
    blogHistoryVersion: function () {
      return Session.get("mdblog-history-list");
    },
    showingHistory: function () {
      /* TODO - this shows the history table for ALL posts, but only puts the CURRENT post in the dialog.
       * This means that if you click the history button for a post on the blog list, then if you look closely
       * at the list, the other blog posts will have their history shown as well.
       * This should be more intelligent, perhaps only returning true if the current blog is the one for which
       * the history button was pressed.
       */
      // It will be shown via a JQuery dialog call, so we hide it at startup
      return Session.get('mdblog-show-history');
    },
    blogPostHistoryTitle: function () {
      return this.title;
    },
  });

  Template.blogRestoreButton.events({
    'click .mdblog-restore-version-button': _restoreVersion
  })

  Template.blogDeleteButton.events({
    'click .mdblog-delete-version-button': _deleteVersion
  })

  Session.set('mdblog-showingHistory', false);

  function _saveHistoryToSessionVariable (history, blogId) {
    // Re-sort newest to oldest
    history.reverse();
    history.forEach(function (version, index) {
      // Cleanup for display - make Date more human-readable
      var verdate = version.date;
      var newdate = (verdate.getMonth() + 1) + "/" + verdate.getDate() + "/" + verdate.getFullYear() + " " + verdate.getHours() + ":" + verdate.getMinutes() + ":" + verdate.getSeconds();
      version.date = newdate;
      if (index === 0) {
        version.actionButton = "blogCurrentVersion";
        version.deleteButton = "blogCurrentVersion";
        version.blogId = blogId
      } else {
        version.actionButton = "blogRestoreButton";
        version.deleteButton = "blogDeleteButton";
        version.blogId = blogId;
      }
      version.vernum = index;
    });
    Session.set("mdblog-history-list", history);
  };

  function _openHistory () {
    var self = this;
    var blogId = this._id;
    Session.set('mdblog-show-history', true);
    Meteor.call('mdblog-getHistory', blogId, function (err, history) {
      if (!history || !history.length || history.length === 0) {
        Session.set('mdblog-show-history', false);
        Session.set("mdblog-history-list");
        alert(TAPi18n.__("alert_no_history"));
        return;
      }
      _saveHistoryToSessionVariable(history, blogId);
      $(function () {
        var title = TAPi18n.__("window_title_history") + " <i>" + self.title + "</i>";
        $("#historyDialog").dialog({
          modal: true,
          title: title,
          closeOnEscape: true,
          closeText: TAPi18n.__("history_button_cancel"),
          draggable: false,
          height: $(window).height() * 0.8,
          width: $(window).width() * 0.8,
          buttons: [
            {
              text: TAPi18n.__("history_button_cancel"),
              click: function () {
                $(this).dialog("close");
              }

              // Uncommenting the following line would hide the text,
              // resulting in the label being used as a tooltip
              //showText: false
            }
          ],
          open: function () {
            $('.ui-widget-overlay').addClass('mdblog-history-modal-overlay');
          },
          close: function () {
            $('.ui-widget-overlay').removeClass('mdblog-history-modal-overlay');
            Session.set('mdblog-show-history', false);
            Session.set("mdblog-history-list");
          }
        });
      });
    });
  }

  function _restoreVersion (event) {
    var userIsSure = confirm(TAPi18n.__("confirm_restore_previous"));
    if (!userIsSure) {
      return;
    }
    var blogId = this.blogId;
    Meteor.call('mdblog-restoreVersion', blogId, this.vernum, function (err, updatedBlog) {
      Router.go('/blog/' + updatedBlog.shortId + '/' + updatedBlog.slug);
    });
  }

  function _deleteVersion (event) {
    var userIsSure = confirm(TAPi18n.__("confirm_delete_previous"));
    if (!userIsSure) {
      return;
    }
    var blogId = this.blogId;
    Meteor.call('mdblog-deleteVersion', blogId, this.vernum, function () {
      Meteor.call('mdblog-getHistory', blogId, function (err, history) {
        _saveHistoryToSessionVariable(history, blogId);
      });
    });
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
    'click #mdblog-delete': _delete,
    'click #mdblog-history': _openHistory
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


  UI.registerHelper('mdBlogDate', function (date) {
    momentLocaleDep.depend();
    return moment(date).calendar();
  });

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

})();

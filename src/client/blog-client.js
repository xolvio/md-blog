(function () {

  var defaultBlogSettings = {
    "name": "Blog",
    "Description": "Blog posts."
  };

  Meta.config({options: {title: '', suffix: '', namespace: ''}});

  if (!Meteor.settings || !Meteor.settings.public || !Meteor.settings.public.blog) {
    Meteor.settings = Meteor.settings || {};
    Meteor.settings.public = Meteor.settings.public || {};
    Meteor.settings.public.blog = defaultBlogSettings;
  }

  if (!Meteor.settings.public.blog.prettify
    || !Meteor.settings.public.blog.prettify['syntax-highlighting']) {
    Meteor.settings.public.blog.prettify = Meteor.settings.public.blog.prettify || {};
    Meteor.settings.public.blog.prettify['syntax-highlighting'] = Meteor.settings.public.blog.prettify['syntax-highlighting'] || true;
  }


  'use strict';

  // ***********************************************************************************************
  // **** Blog List

  Template.blogList.rendered = function () {
    Meta.setTitle(Meteor.settings.public.blog.name);
    Meta.set({name: 'description', content: Meteor.settings.public.blog.name});
    Meta.set({
      name: 'property',
      property: 'og:title',
      content: Meteor.settings.public.blog.name
    });
    Meta.set({
      name: 'property',
      property: 'og:description',
      content: Meteor.settings.public.blog.description
    });
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
      title: 'New Blog Post',
      date: new Date(),
      author: author,
      summary: 'Summary of this post.',
      content: '##**Main Content**' +
      '\nThis is a content editable field. Click here to start editing. Full markdown is supported in here.' +
      '\n\n##**Extra Formatting Options**' +
      '\nIn addition to the markdown support, you also get the following features:' +
      '\n\n###**Pretty Code**' +
      '\n\n```javascript' +
      '\n// check out my method' +
      '\nfunction myMethod() {' +
      '\n  return new Object();' +
      '\n};' +
      '```\n\n' +
      '\n\n###**HTML Tags**' +
      '\nNon-markdown markup is also supported, like <u>underline</u> <sup>super</sup> and <sub>sub</sub> script' +
      '\n\n' +
      '\n\n###**Highly Customizable**' +
      '\nCustom class mappings for prettifying elements allows you to customize the ' +
      'markdown further. For example, you can add classes to make images responsive using ' +
      'the UI framework of your choice.' +
      '\n![alt text](http://www.meteortesting.com/img/og.png "Image Text")'

    };
    Meteor.call('upsertBlog', newBlog);
    Router.go('/blog');
  }

  // ***********************************************************************************************
  // **** Blog Post

  Template.blogPost.rendered = function () {
    if (this.data) {
      Meta.setTitle(this.data.title);
      Meta.set({name: 'description', content: this.data.summary});
      Meta.set({
        name: 'property',
        property: 'og:title',
        content: this.data.title
      });
      Meta.set({
        name: 'property',
        property: 'og:description',
        content: this.data.summary
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
      var userIsSure = confirm('This blog entry is already published. Saved changes will be ' +
      'immediately visible to users and search engines.' +
      '\nClick OK if you are sure.');
      if (!userIsSure) {
        return;
      }
    }
    Meteor.call('upsertBlog', this, function (err, blog) {
      if (!err) {
        Router.go('/blog/' + blog.shortId + '/' + blog.slug);
        Session.set('mdblog-modified', false);
      }
    });
  }

  function _publish () {
    var userIsSure = confirm('Blog entry will be visible to users or search engines.' +
    '\nClick OK if you are sure.');
    if (userIsSure) {
      this.published = true;
      Meteor.call('upsertBlog', this);
    }
  }

  function _unpublish () {
    var userIsSure = confirm('Blog entry will no longer be visible to users or search engines.' +
    '\nClick OK if you are sure.');
    if (userIsSure) {
      this.published = false;
      Meteor.call('upsertBlog', this);
    }
  }

  function _archive () {
    var userIsSure = confirm('Archiving this entry will remove it from the main list view. ' +
    '\nClick OK if you are sure.');
    if (userIsSure) {
      this.archived = true;
      Meteor.call('upsertBlog', this);
    }
  }

  function _unarchive () {
    var userIsSure = confirm('Unarchiving this entry will put it back into the main list view. ' +
    '\nClick OK if you are sure.');
    if (userIsSure) {
      this.archived = false;
      Meteor.call('upsertBlog', this);
    }
  }

  function _delete () {
    var input = prompt('Please type YES in capitals if you are sure you want to delete this entry.' +
    '\nThis action is non-reversible, you should consider archiving instead.');
    if (input === 'YES') {
      Meteor.call('deleteBlog', this, function (e) {
        if (!e) {
          Router.go('blogList');
        }
      });
    }
  }


  UI.registerHelper('mdBlogDate', function (date) {
    return moment(date).calendar();
  });

  moment.locale('en', {
    calendar: {
      lastDay: '[yesterday at] LT',
      sameDay: '[today at] LT',
      nextDay: '[tomorrow at] LT',
      lastWeek: '[last] dddd [at] LT',
      nextWeek: 'dddd [at] LT',
      sameElse: 'on L'
    }
  });

})();
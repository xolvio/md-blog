(function () {

  'use strict';

  Template.blogPost.helpers({
    content: function () {
      var $content = $('<p/>', {html: marked(this.content)});
      _prettify($content);
      return $content.html();
    }
  });

  Template.blogList.helpers({
    content: function () {
      return marked(this.summary);
    }
  });

  function _addSyntaxHighlighting (e) {
    e.find('pre code').each(function (i, block) {
      hljs.highlightBlock(block);
    });
  }

  function _makeImagesResponsive (e) {
    e.find('img').each(function (idx, img) {
      var $img = $(img);
      if (!$img.hasClass('pure-img')) {
        $img.addClass('pure-img');
      }
    });
  }

  function _prettify (content) {
    _addSyntaxHighlighting(content);
    _makeImagesResponsive(content);
  }

})();
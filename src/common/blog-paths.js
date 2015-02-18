
getBaseBlogPath = function () {
  return Meteor.settings.public.blog.blogPath;
}

getBaseArchivePath = function () {
  return Meteor.settings.public.blog.archivePath;
}

getBlogPostPath = function (shortId, slug) {

  var path = getBaseBlogPath();
  if (Meteor.settings.public.blog.useUniqueBlogPostsPath) {
    path += '/' + shortId;
  }
  path += '/' + slug;

  return sanitizePath(path);
}

getBlogPostUrl = function (post) {

  return Meteor.settings.public.blog.baseUrl + '/'
    + getBlogPostPath(post.shortId, post.slug);
}

/*
 * Remove any duplicate '/'
 */
sanitizePath = function (path) {
  return _.compact(path.split('/')).join('/');
}

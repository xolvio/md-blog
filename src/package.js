Package.describe({
  name: 'xolvio:md-blog',
  summary: 'A markdown powered blog',
  version: '0.2.0',
  git: 'https://github.com/xolvio/md-blog'
});

Npm.depends({});

Package.on_use(function (api) {

  // APIs
  api.use(['meteor-platform@1.2.0', 'less@1.0.11']);
  api.use(['spiderable@1.0.5', 'less@1.0.11']);
  api.use(['reactive-var@1.0.3'], ['client', 'server']);
  api.use(['iron:router@1.0.0'], ['client', 'server']);
  api.use(['chuangbo:marked@0.3.5'], ['client', 'server']);
  api.use(['mrt:moment@2.8.1'], ['client', 'server']);
  api.use(['yasinuslu:blaze-meta@0.2.1'], ['client', 'server']);
  api.use(['xolvio:hljs@0.0.1'], ['client']);
  api.use(['alanning:roles@1.2.13'], ['client', 'server']);

  // Common
  api.add_files(['common/blog-collections.js'], ['client', 'server']);

  // Server
  api.add_files(['server/blog-server.js'], 'server');

  // Client
  api.add_files(['client/blog-templates.html'], 'client');
  api.add_files(['client/blog-client.js'], 'client');
  api.add_files(['client/blog-route.js'], 'client');
  api.add_files(['client/blog.less'], 'client');

  api.add_files(['README.md'], 'server', {isAsset: true});

  api.export('Blog');

});

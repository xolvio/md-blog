Package.describe({
  name: 'xolvio:md-blog',
  summary: 'A markdown powered blog with i18n and lots of cutomization options.',
  version: '0.4.0',
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
  api.use(['xolvio:hljs@0.0.1'], ['client']);
  api.use(['alanning:roles@1.2.13'], ['client', 'server']);
  api.use(['fortawesome:fontawesome@4.2.0_2'], ['client']);
  api.use(['tap:i18n@1.3.1'], ['client', 'server']);

  // Common
  api.add_files(['common/blog-collections.js'], ['client', 'server']);

  // package-tap.i18n must be loaded before the templates
  api.add_files("package-tap.i18n", ["client", "server"]);

  // Server
  api.add_files(['server/blog-server.js'], 'server');

  // Client
  api.add_files(['client/blog-templates.html'], 'client');
  api.add_files(['client/blog-client.js'], 'client');
  api.add_files(['client/blog-route.js'], 'client');
  api.add_files(['client/blog.less'], 'client');

  // List languages files so Meteor will watch them and rebuild package as they change.
  // Languages files must be loaded after the templates
  // otherwise the templates won't have the i18n capabilities (unless
  // you'll register them with tap-i18n yourself).
  api.add_files([
    "i18n/en.i18n.json",
    "i18n/fr.i18n.json"
    ], ["client", "server"]);

  api.export('Blog');

});

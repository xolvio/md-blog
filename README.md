This is the blog package currently used on The Meteor Testing Manual.


It will give you a blog on your site. You will have two new routes: `/blog` and `/blog/:slug`.

You need to define these templates in your main app and structure/style them as you like:

```html
<template name="blogListLayout">
  {{> yield}}
</template>

<template name="blogPostLayout">
  {{> yield}}
</template>
```

And for SEO purposes, you need to set the following settings:
```json
{
  "public": {
    "blog": {
      "name": "The Name Of Your Blog",
      "Description": "Get the latest news on what's happening in the Meteor testing landscape."
    }
  }
}
```

Currently this package doesn't have an editor! That part is coming when time permits. You can do
this in the meantime. Create a file called `blogLoader.js` (or similar) with this setup:

```javascript
Meteor.startup(function () {

  // this is a new deployment so empty the blog
  Blog.remove({});

  // add new entries like this
  Blog.insert({
    slug: 'my-blog-entry',
    title: "My Blog Entry",
    author: "Sam Hatoum",
    date: "Mon Dec 1 2014 13:33:01 GMT-0800 (PST)",
    summary: "This is my first blog entry",
    content: Assets.getText('blog/my-blog-entry.md'),
    order: 6
  });

  // rest of the entries
  // Blog.insert ...

});

```

and create blog entries as markdown docs under `/private/blog`

Pull requests are welcome to add an editor :)

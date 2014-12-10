Xolv.io MD-Blog
===============


###Getting Started

#### 1. Setup Accounts & Roles
You need to ensure you are using a Meteor accounts package like accounts-password, and that the
user you are logged has 'roles' array with the element `mdblog-author`. Here's an example of a
user object:

```json
{
  _id: "ixoreoJY5wzmNYMcY",
  emails: [ {
    "address" : "sam@xolv.io",
    "verified" : true
  } ],
  profile: { "name" : "Sam Hatoum" },
  roles: [ "mdblog-author" ]
}
```

You can also the above pragmatically by calling
`Roles.addUsersToRoles(user._id, ['mdblog-author']);`

#### 2. Define Templates
This is the blog package currently used on The Meteor Testing Manual. It will give you a blog on
your site. You will have two new routes: `/blog` and `/blog/:_id/:slug`.

You need to define these templates in your main app and structure/style them as you like:

```html
<template name="blogListLayout">
  {{> yield}}
</template>

<template name="blogPostLayout">
  {{> yield}}
</template>
```

Here you can customize the template further by adding disqus for instance:

```html
<template name="blogPostLayout">
  {{> yield}}
  {{> disqus}}
</template>
```

#### 3. Customize

This blog is designed to be fully customizable and as unopinionated as possible.

####Styling
For syntax highlighting, you need to add the hljs css file of your choice.
[Pick a css template from here](https://highlightjs.org/static/demo/). You can also isable


####Settings File
{
  "public": {
    "blog": {
      "name": "The Meteor Testing Manual Blog",
      "Description": "Get the latest news on what's happening in the Meteor testing landscape.",
      "prettify": {
        "syntax-highlighting": true,
        "element-classes": [
          {
            "locator": "img",
            "classes": ["pure-img"]
          }
        ]
      },
      "sortBy": {"date": -1}
    }
  }
}

####Sorting

####Custom Classes


##URL
The URL format of your blog will look lik this:

`www.your-site.com/blog`

`www.your-site.com/blog/7yh22/your-latest-blog-post`

The format is `/:_id/:slug`

The `:slug` is the title of the blog post with all the spaces replaced with dashes. It's believed
this is good for SEO purposes.

The `:_id` is a truncated version of the mongo id for the blog entry. This allows you to have
multiple posts with the same title over time.

##Customizing

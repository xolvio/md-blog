MeteorSettings.setDefaults({ public:
  { blog:
    { pictures:
      { Slingshot: {
          bucket: 'mdblog-app-files',
          directive: 'mdblog-pictures',
          pemFile: 'google-cloud-service-key.pem',
          idTextFile: 'google-cloud-access-id.txt'
        }
      }
    }
  }
});

Meteor.startup(function () {

  var settings = Meteor.settings.public.blog.pictures.Slingshot;

  var pemText = (settings.pemFile) ? Assets.getText(settings.pemFile).trim() : null;
  var idText = (settings.idTextFile) ? Assets.getText(settings.idTextFile).trim() : null;

  if (idText && pemText) {
    console.info("Initializing Slingshot for Google Cloud Storage.");

    Slingshot.GoogleCloud.directiveDefault.GoogleSecretKey = pemText;
    Slingshot.GoogleCloud.directiveDefault.GoogleAccessId = idText;

    Slingshot.createDirective(settings.directive, Slingshot.GoogleCloud, {
      bucket: settings.bucket,
      acl: "public-read",

      authorize: function () {
        /* Deny uploads if user is not logged in */
        if (!this.userId) {
          var message = "Please login before posting files";
          throw new Meteor.Error("Login Required", message);
        }

        return true;
      },

      key: function (file) {
        /* TODO use a directory */
        return file.name;
      }
    });
  }
});

Meteor.startup(function () {

  var pemText = Assets.getText('google-cloud-service-key.pem').trim();
  var idText = Assets.getText('google-cloud-access-id.txt').trim();

  if (idText && pemText) {
    console.info("Initializing Slingshot for Google Cloud Storage.");

    Slingshot.GoogleCloud.directiveDefault.GoogleSecretKey = pemText;
    Slingshot.GoogleCloud.directiveDefault.GoogleAccessId = idText;

    Slingshot.createDirective("mdblog-pictures", Slingshot.GoogleCloud, {
      bucket: "mdblog-app-files",
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

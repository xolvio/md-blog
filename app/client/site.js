Template.header.events({
  'click .sign-out' : function() {
    Meteor.logout();
  }
});
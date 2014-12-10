Accounts.onCreateUser(function (options, user) {
  user.roles = ['mdblog-author'];
  if (options.profile)
    user.profile = options.profile;
  return user;
});

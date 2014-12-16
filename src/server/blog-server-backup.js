(function () {

    'use strict';
    var fs = Npm.require('fs');
    var Fiber = Npm.require('fibers');

    Meteor.methods({
        /*
         * Added 12/12/14 Aaron Cammarata acammarata@voidalpha.com for backup/restore feature
         */
        'mdBlogDeleteAllBlogData': function () {
            if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
                Blog.remove({});
            } else {
                throw new Meteor.Error(403, "Not authorized to author blog posts");
            }
        },
        'mdBlogBackup': function () {
            if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
                var backupFilename = process.env.HOME + "/mdblog-backup.txt";
                var fileStream = fs.createWriteStream(backupFilename, {flags: "w"});
                Blog.find().forEach(function (blogPost) {
                    fileStream.write(JSON.stringify(blogPost), function (err) {
                        if (err) {
                            console.error(err);
                        }
                    });
                    fileStream.write("\n");
                })


                //fileHandle.write("Testing");
            } else {
                throw new Meteor.Error(403, "Not authorized to author blog posts");
            }
        },
        'mdBlogRestore': function () {
            if (Roles.userIsInRole(this.userId, ['mdblog-author'])) {
                var backupFilename = process.env.HOME + "/mdblog-backup.txt";
                try {
                    var fileStream = fs.createReadStream(backupFilename, {flags: "r"});
                    fileStream.on('readable', function () {
                        var chunk = fileStream.read(1),
                            indentLevel = 0,
                            thisRecord = "";
                        while (chunk) {
                            chunk = chunk.toString();
                            if (chunk === "{") {
                                indentLevel++;
                            } else if (chunk === "}") {
                                indentLevel--;
                            }
                            thisRecord = thisRecord.concat(chunk);
                            if (indentLevel == 0 && thisRecord.length > 1) {
                                new Fiber(function() {
                                    var postAsJson = JSON.parse(thisRecord);
                                    delete postAsJson["_id"];
                                    Blog.insert(postAsJson);
                                }).run();
                                thisRecord = "";
                            }
                            chunk = fileStream.read(1);
                        };
                    });
                } catch (e) {
                    console.error("Could not open " + backupFilename + " for reading to restore mdblog data!");
                }
            } else {
                throw new Meteor.Error(403, "Not authorized to author blog posts");
            }
        }
        /*
         * end backup/restore
         */
    });

    Meteor.startup(function () {
    });

})();
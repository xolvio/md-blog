MeteorSettings.setDefaults({ public:
  { blog:
    { pictures: {
        maxWidth : 800,
        maxHeight : 800
      }
    }
  }
});

_allowPictureUpload = function () {

  return Meteor.settings.public.blog.pictures.Slingshot;
};

_insertPictures = function (blogPost, files) {

  _.each(files, function (file) {
    /* Filter out dropped non-image files */
    if (file.type.indexOf("image") === 0) {
      __insertPicture (blogPost, file);
    }
  });
};

function __insertPicture (blogPost, file) {

  var maxWidth = Meteor.settings.public.blog.pictures.maxWidth;
  var maxHeight = Meteor.settings.public.blog.pictures.maxHeight;

  function doneUploading (error, downloadUrl) {

    console.info('Done uploading:', downloadUrl, 'Error:', error);
    if (error) {
      alert (error);
    }
    else {
      var element = $('article#content')[0];
      element.focus();
      var markdown = "![" + file.name + "](" + downloadUrl + ")<br>";
      element.innerHTML = markdown + element.innerHTML;
      __update(blogPost, element);
    }
  }

  function uploadAndInsert (dataURI) {

    var data = dataURI.substring(dataURI.indexOf(',') + 1);
    var blob = b64toBlob(data, file.type);
    blob.name = file.name;
    if (file.size < blob.size) {
      /* upload the smallest of the two files */
      console.warn('Warning: ignored processing as it resulted in larger file.', file.size, blob.size);
      blob = file;
    }

    var uploader = new Slingshot.Upload(Meteor.settings.public.blog.pictures.Slingshot.directive);
    uploader.send( blob, doneUploading );
  }

  processImage( file, maxWidth, maxHeight, uploadAndInsert );
}

/* From http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
 * TODO use https://github.com/eligrey/canvas-toBlob.js
 */
function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;
  var byteCharacters = atob(b64Data);
  var byteArrays = [];
  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);
    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
    }
    var byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob( byteArrays, { type: contentType } );
}

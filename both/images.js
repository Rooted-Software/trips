import { FilesCollection } from 'meteor/ostrio:files';
import { Random } from 'meteor/random'
import { getSignedURLs } from '/imports/api/miscFunctions';
import gm from 'gm';
import knox from 'knox';


var bound, client, Request, cfdomain, createThumbnails;

if (Meteor.isServer) {
  // Fix CloudFront certificate issue
  // Read: https://github.com/chilts/awssum/issues/164
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

  Request = Npm.require('request');
  bound = Meteor.bindEnvironment(function(callback) {
    return callback();
  });
  cfdomain = Meteor.settings.AWS.cfdomain; // <-- Change to your Cloud Front Domain
  client = knox.createClient({
    key: Meteor.settings.AWS.key,
    secret: Meteor.settings.AWS.secret,
    bucket: Meteor.settings.AWS.bucket,
    region: Meteor.settings.AWS.region
  });

  createThumbnails = function(collection, fileRef) {
    const cropName = fileRef.path + "__thumbnail__." + fileRef.extension;
    var image = gm(fileRef.path);

    var Future = Npm.require('fibers/future');
    var fut = new Future();
    var updateAndSave = function(error){
      return bound(function(){
        if (error)
          console.error( error);
        const upd = {
          $set: {
            "versions.thumbnail" : {
              path: cropName,
              type: fileRef.type,
              extension: fileRef.extension
            }
          }
        };
        fut.return(collection.update( fileRef._id, upd ));
      });
    };
    image.resize(250, 250).write(cropName, updateAndSave);

    return fut.wait();
  };
}

Images = new FilesCollection({
  debug: false, // Change to `true` for debugging
  throttle: false,
  storagePath: Meteor.settings.public.File.path,
  collectionName: 'Images',
  allowClientCode: false,
  onBeforeUpload(file) {
    // Allow upload files under 20MB, and only in png/jpg/jpeg formats
    if (file.size <= 20971520 && /png|jpg|jpeg/i.test(file.extension)) {
      return true;
    } else {
      if(file.extension === 'pdf'){
        return 'Your image cannot be in PDF format. It needs to be jpg, png or jpeg.' +
          ' Try scanning it again, but scan it as an image, not a document.';
      }
      return 'Please upload and image (jpg, png or jpeg), with size less than 20MB';
    }
  },
  onAfterUpload: function(fileRef) {
    let createdThumbnail = createThumbnails(this.collection, fileRef);
    Meteor.setTimeout(()=>{
      // In onAfterUpload callback we will move file to AWS:S3
      var self = this;
      let updatedFileVersions = Images.findOne({_id: fileRef._id});

      _.each(updatedFileVersions.versions, function(vRef, version) {
        // We use Random.id() instead of real file's _id
        // to secure files from reverse engineering
        // As after viewing this code it will be easy
        // to get access to unlisted and protected files
        var filePath = "files/" + (Random.id()) + "-" + version + "." + fileRef.extension;
        client.putFile(vRef.path, filePath, function(error, res) {
          bound(function() {
            var upd;
            if (error) {
              console.error(error);
            } else {
              upd = {
                $set: {}
              };
              upd['$set']["versions." + version + ".meta.pipeFrom"] = cfdomain + '/' + filePath;
              upd['$set']["versions." + version + ".meta.pipePath"] = filePath;
              self.collection.update({
                _id: fileRef._id
              }, upd, function(error) {
                if (error) {
                  console.error(error);
                } else {
                  // Unlink original files from FS
                  // after successful upload to AWS:S3
                  self.unlink(self.collection.findOne(fileRef._id), version);
                  getSignedURLs(client, version, fileRef._id, function(err, res){
                    if (err) console.error(err);
                    else console.log(res);
                  });
                }
              });
            }
          });
        });
      });
    },2000);
  },
  interceptDownload: function(http, fileRef, version) {
    var path, ref, ref1, ref2;
    path = (ref = fileRef.versions) != null ? (ref1 = ref[version]) != null ? (ref2 = ref1.meta) != null ? ref2.pipeFrom : void 0 : void 0 : void 0;
    if (path) {
      // If file is moved to S3
      // We will pipe request to S3
      // So, original link will stay always secure
      Request({
        url: path,
        headers: _.pick(http.request.headers, 'range', 'accept-language', 'accept', 'cache-control', 'pragma', 'connection', 'upgrade-insecure-requests', 'user-agent')
      }).pipe(http.response);
      return true;
    } else {
      // While file is not yet uploaded to S3
      // We will serve file from FS
      return false;
    }
  }
});

if (Meteor.isServer) {
  // Intercept File's collection remove method
  // to remove file from S3
  var _origRemove = Images.remove;

  Images.remove = function(search) {
    var cursor = this.collection.find(search);
    cursor.forEach(function(fileRef) {
      _.each(fileRef.versions, function(vRef) {
        var ref;
        if (vRef != null ? (ref = vRef.meta) != null ? ref.pipePath : void 0 : void 0) {
          client.deleteFile(vRef.meta.pipePath, function(error) {
            bound(function() {
              if (error) {
                console.error(error);
              }
            });
          });
        }
      });
    });
    // Call original method
    _origRemove.call(this, search);
  };
}
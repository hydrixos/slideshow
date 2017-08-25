import { Meteor } from 'meteor/meteor';
import '/common/file.js'

FS = Npm.require('fs')
FSMonitor = Npm.require('fsmonitor')
ExpandTilde = require('expand-tilde');

/*
 * Collection of images seen so far
 */
Meteor.publish('seenImages', function() { return SeenImages.find(); });

/*
 * Collection of images on disk
 *
 * Make sure all paths end with /!
 */
var imagesFolder = ExpandTilde("~/Dropbox/Pictures/");
var imagesServerURL = 'images/';
var imageSwitchInterval = 20000;

// Creates an image descriptor
function getFileDescriptor(relativePath) {
	return {'path': relativePath,
			'url': 	encodeURI(imagesServerURL + relativePath),
			'created_at': FS.statSync(imagesFolder + "/" + relativePath).ctime
		   }
}

// Whether or not the file is an image
function isImageFilename(filename) {
	return filename.match(/.(jpg|jpeg|png|gif)$/i) !== null;
}

// Setup collection of images on disk
Meteor.publish('images', function() { return Images.find(); });

Meteor.startup(function() {
	Images.remove({});

	function readImages(relativePath) {
		var fullPath = imagesFolder + "/" + relativePath
		var files = FS.readdirSync(fullPath);
		if (!files)
			return;

		_.each(files, function(file) {
			if (isImageFilename(file)) {
				console.log("Found Image: ", file);
				Images.insert(getFileDescriptor(relativePath + "/" + file));
	  		}
			 else if (FS.statSync(fullPath + "/" + file).isDirectory()) {
				readImages(relativePath + "/" + file);
			}
		});
	}

	readImages("/");

});

// Update on file changes
FSMonitor.watch(imagesFolder, null, Meteor.bindEnvironment(function(change) {
	_.each(change.addedFiles, function(addedFile) {
		if (isImageFilename(addedFile)) {
			console.log("Added Image: ", addedFile);
			Images.insert(getFileDescriptor(addedFile));
		}
	});
	_.each(change.removedFiles, function(removedFile) {
		if (isImageFilename(removedFile)) {
			console.log("Removed Image: ", removedFile);
			Images.remove({path: removedFile});
		}
	});
}));


/*
 * Serve assets
 */
WebApp.connectHandlers.use(function(request, response, next) {
    var request = /^\/images\/(.*)$/.exec(request.url);
    if (request !== null) {
        var filePath = imagesFolder + decodeURI(request[1]);
        var data = FS.readFileSync(filePath, data);
        response.writeHead(200, {
                'Content-Type': 'image',
				'ETag': '12345'
            });
        response.write(data);
        response.end();
    } else {  // Other urls will have default behaviors
        next();
    }
});

/*
 * Image switching
 */
var imageSwitchingTimer;
Images.find().observeChanges({added: function() {
	Meteor.clearInterval(imageSwitchingTimer);
	imageSwitchingTimer = Meteor.setInterval(function() { Meteor.call("nextImage"); }, imageSwitchInterval);
}});


Meteor.methods({
	nextImage: function() {
		var image = Images.currentImage();
		if (image) {
			SeenImages.insert({path: image.path, seen_at: new Date()});
		}

		if (Images.find().count() > 0 && (!Images.currentImage())) {
			SeenImages.remove({});
		}
	}
});

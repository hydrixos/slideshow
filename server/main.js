import { Meteor } from 'meteor/meteor';
import '/common/file.js'

FS = Npm.require('fs')
FSMonitor = Npm.require('fsmonitor')

/*
 * Collection of images seen so far
 */
Meteor.publish('seenImages', function() { return SeenImages.find(); });

/*
 * Collection of images on disk
 */
var imagesFolder = '/home/frieder/Pictures/';
var imagesServerURL = 'images/';
var imageSwitchInterval = 20000;

// Creates an image descriptor
function get_file_descriptor(relativePath) {
	return {'path': relativePath,
			'url': 	encodeURI(imagesServerURL + relativePath),
			'created_at': FS.statSync(imagesFolder + relativePath).ctime
		   }
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
			if (file.match(/.(jpg|jpeg|png|gif)$/i) !== null) {
				console.log("Found Image: ", file);
				Images.insert(get_file_descriptor(relativePath + "/" + file));
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
		console.log("Added Image: ", addedFile);
		Images.insert(get_file_descriptor(addedFile));
	});
	_.each(change.removedFiles, function(removedFile) {
		console.log("Removed Image: ", removedFile);
		Images.remove({path: removedFile});
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

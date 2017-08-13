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
var imagesFolder = '/Users/frieder/testfolder/';
var imagesServerURL = 'images/';
var imageSwitchInterval = 20000;

// Creates an image descriptor
function get_file_descriptor(path) {
	return {'path': path,
			'url': 	encodeURI(imagesServerURL + path),
			'created_at': FS.statSync(imagesFolder + path).ctime
		   }
}

// Setup collection of images on disk
Meteor.publish('images', function() { return Images.find(); });

Meteor.startup(function() {
	Images.remove({});

	var images = FS.readdirSync(imagesFolder);
	_.each(images, function(image) {
	  if (image.match(/.(jpg|jpeg|png|gif)$/i) !== null) {
		  Images.insert(get_file_descriptor(image));
	  }
	});
});

// Update on file changes
FSMonitor.watch(imagesFolder, null, Meteor.bindEnvironment(function(change) {
	_.each(change.addedFiles, function(addedFile) {
		Images.insert(get_file_descriptor(addedFile));
	});
	_.each(change.removedFiles, function(removedFile) {
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
function switchImage() {
	var image = Images.currentImage();
	if (image) {
		SeenImages.insert({path: image.path});
	}

	if (Images.find().count() > 0 && (!Images.currentImage())) {
		SeenImages.remove({});
	}
}

var imageSwitchingTimer;
Images.find().observeChanges({added: function() {
	Meteor.clearInterval(imageSwitchingTimer);
	imageSwitchingTimer = Meteor.setInterval(switchImage, imageSwitchInterval);
}});

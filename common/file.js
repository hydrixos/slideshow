Images = new Mongo.Collection('images');
SeenImages = new Mongo.Collection('seenImages');

Images.currentImage = function() {
	image = Images.findOne({path: {$nin: SeenImages.find().map(function(item) {return item.path; })}}, {sort: {created_at: -1}});
	return image
};

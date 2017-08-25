import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Meteor.subscribe('images');
Meteor.subscribe('seenImages');

import './main.html';

Template.image.onCreated(function switcherOnCreated() {
	$("body").keydown(function(event) {
		switch (event.keyCode) {
			case 39:
			case 40:
				Meteor.call("nextImage");
				break;
		}
	});
});

Template.image.helpers({
	currentImage() {
		return Images.currentImage();
	}
});

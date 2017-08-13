import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Meteor.subscribe('images');
Meteor.subscribe('seenImages');

import './main.html';

Template.image.onCreated(function switcherOnCreated() {
});

Template.image.helpers({
	currentImage() {
		return Images.currentImage();
	}
});

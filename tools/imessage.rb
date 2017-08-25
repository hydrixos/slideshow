#!/usr/bin/ruby

#
# A hack to copy pictures received via iMessage to a Dropbox folder. Just
# run this script on a user account capable of receiving images.
#
# Last tested with macOS 10.12
#
loop {
	puts "Wait"
	`fswatch -1r ~/Library/Messages/Attachments/`
	puts "Changes received"
	sleep(1)
	`rsync -r ~/Library/Messages/Attachments/ ~/Dropbox/iMessage/`
}

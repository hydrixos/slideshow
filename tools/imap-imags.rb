#!/usr/bin/env ruby
require 'net/imap'
require 'mail'
require 'fileutils'

#
# This is a simple tool polling images from an IMAP account and writing it to a folder.
# Uses IMAP mail flags to verify whether mails have been already processed or not.
#
# Based on https://stuff-things.net/2016/03/02/advanced-ruby-imap/
#

if (ARGV.count < 4)
	puts "Usage: imap-images.rb HOST USERNAME PASSWORD TARGET_FOLDER"
	puts ""
	puts "Checks the given IMAP account for new mails and downloads all image attachments from all unflaged mails. Flags mails afterwards."
	exit -1
end

host = ARGV[0]
username = ARGV[1]
password = ARGV[2]
target_folder = ARGV[3]

imap = Net::IMAP.new(host, ssl: true)

begin
  imap.authenticate('PLAIN', username, password)
rescue
  abort 'Authentication failed'
end

imap.select('INBOX')

loop {
  ids = imap.search(['NOT','DELETED','NOT','FLAGGED'])

  if (ids.count > 0)
    imap.fetch(ids,['UID','RFC822']).each do |imap_message|
      begin
    	  message = Mail.read_from_string imap_message.attr['RFC822']
    	  id = message.message_id
    	  path = "#{target_folder}/#{id}/"

		  #
		  # Handle non-multipart mails only consisting of a single image
		  # (happens with Apple Mail when sending a Mail only containing an image, but
		  # no text)
		  #
    	  if (!message.multipart? && message.content_type.start_with?("image/"))
    		  filename = message.content_type_parameters["name"]
    		  if (filename)
    			  FileUtils.mkdir_p path
    			  File.open(path + filename, "w+b", 0644) {|f| f.write message.body.decoded}
    		  end

		 #
		 # Normal case: Multipart message with image attachments
		 #
    	  else
    	  	message.attachments.each {|attachment|
    		  if (attachment.content_type.start_with?('image/'))
    		    filename = attachment.filename
    			FileUtils.mkdir_p path
    		    File.open(path + filename, "w+b", 0644) {|f| f.write attachment.decoded}
    		 end
    	   }
      	end
      rescue => e
    	puts "Error while processing message: #{e.message}"
      end

      uid = imap_message.attr['UID']
      imap.uid_store(uid, "+FLAGS", [:Flagged])
    end
  end

  sleep(30)
}

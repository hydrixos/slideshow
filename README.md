# Auto-updating Folder Slideshow

This repo contains a simple web application that shows a slideshow of images
stored inside a folder hierarchy inside a browser window. In addition it
observes the folder for changes and presents new images that were added to the
folder while the app was already running. It was implemented using the Meteor framework.

I used this during a party in combination with several chat services
(e.g. Whatsapp, Telegram, iMessage, Mail). Our guests where able to send images
to a phone number or an email address. All images sent to this number / address were instantaneously 
presented on a display together with all older images. 

Please note: This has been hacked very fast without much Meteor / Node expertise :).

#### Basic Setup

The slideshow app itself can run on Linux and MacOS. I configured it to show the
contents of a Dropbox folder. You can run the slideshow app by following these
steps:

1. Install the Meteor runtime – https://www.meteor.com/install
2. Clone this repo
3. Specify your images folder by setting `imageFolder` in `server/main.json`.
   You should not place the images within the meteor app folder, since image
   changes would always restart the entire app.
4. Open a Terminal inside the repo and run `meteor`
5. Open a web browser on http://localhost:3000. I recommend using Chrome.
6. Place some images inside your images folder and see what happens :)

#### Whatsapp / Telegram

To receive images from Whatsapp an Telegram I've used the following hacky setup:

1. I've ordered a new prepaid card to have a distinct phone number
2. I've set up an Android phone with Whatsapp and Telegram
3. I've bought the Pro version of "Dropsync" and configured it to mirror the
   Whatsapp/Telegram image cache to a Dropbox folder. This Dropbox folder is
   synced to the device presenting the slideshow.
4. Whatsapp seems only to download images from known phone numbers – so I had
   to add the phone numbers of all expected party guests. Telegram works out-of-the-box.

#### Mail
In addition, I've created a script that polls a Mail account for new mails
containing image attachments. Mails were also automatically copied to
the Dropbox folder.

You find it in `tools/imap-image.rb`. You need to install the `mail` Gem before
running the script:

	gem install mail

To run the script, you have to pass the following arguments:

	imap-image.rb HOST USERNAME PASSWORD TARGETFOLDER

The script will poll your IMAP server every 60 seconds.

#### iMessage
To receive images on iMessage, I've created a further script that reads the
iMessage image cache folder on macOS and copies it to a dropbox folder. (You
can find it in tools/imessage.rb).

You find it in `tools/imessage.rb`. You need to install the `fswatch` Gem before
running the script:

	gem install fswatch

After starting the script, it will wait for incomming iMessages and copies them
to the given target folder.

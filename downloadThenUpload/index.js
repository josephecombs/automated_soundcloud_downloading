exports.handler = (event, context, callback) => {  
  console.log('executing lambda function');
  var newEvent = {
    soundcloud_id: null,
    genre: null,
    url: null,
    timestamp: null,
    fileName: null,
  };
    
  var exit = false;
  console.log(event.Records);
  event.Records.forEach((record) => {
    console.log(record.dynamodb)
    if (!(record.eventName === 'INSERT' || record.eventName === 'MODIFY')) {
      console.log('BLOCKED THE EXECUTION OF A REMOVE EVENT');
      exit = true;
    }
  });

  // done to prevent REMOVE events from fucking up logging
  if (exit) return;

  event.Records.forEach((record) => {
    if (!record.dynamodb.NewImage) return;
    newEvent.soundcloud_id = record.dynamodb.NewImage.soundcloud_id.S;
    newEvent.genre = record.dynamodb.NewImage.genre.S;
    newEvent.url = record.dynamodb.NewImage.url.S;
    newEvent.timestamp = record.dynamodb.NewImage.timestamp.S;
    //this sanitizing prevents path errors when uploading to dropbox
    newEvent.fileName = record.dynamodb.NewImage.title.S.replace(/\//g, '').replace(/\\/g, '').trim() + '.mp3';
  });
  
  console.log('newEvent');
  console.log(newEvent);
	
	var fs = require('fs');
  var chmod = require('gulp-chmod');
	var youtubedl = require('youtube-dl');
	var video = youtubedl(newEvent.url,
	  ['--format=bestaudio']
	);

  video.on('end', function(info) {
    var accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    
    var Dropbox = require('dropbox');
    var dbx = new Dropbox({ accessToken: accessToken });
    
    fs.readFile('/tmp/mysong.mp3', (err, contents) => {
      console.log('SUCCESSFULLY READ FILE');
      if (err) {
        if (err.code === "EEXIST") {
          console.error('myfile already exists');
          return;
        } else {
          throw err;
        }
      }
      
      // dropbox piece
      console.log('PRE UPLOADING FILE');
      dbx.filesUpload({path: '/' + newEvent.fileName, contents: contents})
      .then(function(response) {
        console.log(response);
      })
      .catch(function(error) {
        console.error(error);
      });
      console.log('POST UPLOADING FILE');
    });
	});

  video.pipe(fs.createWriteStream('/tmp/mysong.mp3'));
};
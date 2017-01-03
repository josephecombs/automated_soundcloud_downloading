'use strict';

exports.handler = (event, context, callback) => {
  const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    body: err ? err.message : JSON.stringify(res),
    headers: {
      'Content-Type': 'application/json',
    },
  });
    
  const AWS = require('aws-sdk');
  AWS.config.update({region:'us-east-1'});

  var lambda = new AWS.Lambda();
  var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
  
  switch (event.httpMethod) {
  case 'DELETE':
    break;
  case 'GET':    
    done();
    break;
  case 'POST':
    var info = JSON.parse(event.body);
    var params = {
      Item: {
        soundcloud_id: {
          S: info.soundcloud_id
        },
        url: {
          S: info.url
        },
        genre: {
          S: info.genre
        },
        timestamp: {
          S: info.timestamp
        },
        title: {
          S: info.title
        }
      },
      TableName: 'soundCloudData'
    };
    console.log(params);
    dynamodb.putItem(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log(data);
      }
    });
    done();
  case 'PUT':
    break;
  default:
    done(new Error(`Unsupported method "${event.httpMethod}"`));
  }
};

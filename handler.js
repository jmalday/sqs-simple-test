'use strict';
var AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS({
  apiVersion: 'latest',
  region: process.env.DEPLOY_REGION,
});

module.exports.hello = async (event, context, callback) => {
  let body = JSON.parse(event.body);

  await sqs.sendMessage({
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify({
      userId: body.name, 
      noteId: body.note
    }),
}).promise();

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      {
        name: body.name,
      }
    ),
  });
};

module.exports.retrive = async (event, context, callback) => {
  let response= "No hay mensajes";
  await dynamo.scan({
    TableName: process.env.TABLE_NAME, 
    Limit: 5, 
  }, 
  function (err,data) {
    if (err){
      console.log(err, err.stack);
    } else{
      console.log(data);
      let itemCount = data.Count;
      response = JSON.stringify({
        descripcion: `Tienes ${itemCount} mensages`, 
        messages: data.Items 
      })
    }
  }
  ).promise();
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      {
        messages: response,
      }
    ),
  });
};

module.exports.saveMessage = async (event, context) => {
  var current = new Date();
  for (const record in event.Records) {
    if (Object.hasOwnProperty.call(event.Records, record)) {
      const element = event.Records[record];
      let body = JSON.parse(element.body);
    await dynamo.put({
      TableName: process.env.TABLE_NAME,
      Item: {
        userId: body.userId,
        noteId: body.noteId,
        updateTime: current.toLocaleString()
      }
    })
    .promise();
    }
  }
 
};
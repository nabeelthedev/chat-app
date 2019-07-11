// var AWS = require('./node_modules/aws-sdk')
var AWS = require('aws-sdk')
var ddb = new AWS.DynamoDB()
var getRandomString = () => {
  var chars = '0123456789abcdefghiklmnopqrstuvwxyz'
  var string_length = 8
  var randomstring = ''
  for (var i = 0; i < string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum, rnum + 1)
  }
  return randomstring
}

exports.handler = async (event, context) => {
  console.log('EVENT: ' + JSON.stringify(event))
  console.log('CONTEXT: ' + JSON.stringify(context))
  try {
    var response = {}
    var referenceLinkIsUnique = false
    var params = {
      TableName: process.env.ReferenceLinksTableName,
      ProjectionExpression: 'id',
      ConsistentRead: true
    }
    var newReferenceLinkID
    while (!referenceLinkIsUnique) {
      newReferenceLinkID = getRandomString()

      params.Key = {
        id: {
          S: newReferenceLinkID
        }
      }

      await ddb
        .getItem(params)
        .promise()
        .then(result => {
          console.log(result.Item)
          if (!result.Item) {
            referenceLinkIsUnique = true
          }
        })
        .catch(err => {
          throw err
        })
    }
    // 24 hours
    var expirationTime = (
      Math.floor(Date.now() / 1000) +
      24 * 60 * 60
    ).toString()

    params = {
      TableName: process.env.ReferenceLinksTableName,
      Item: {
        id: {
          S: newReferenceLinkID
        },
        value: {
          S: event.value.S
        },
        ExpirationTime: {
          N: expirationTime
        }
      },
      ConditionExpression: 'attribute_not_exists(id)'
    }

    await ddb
      .putItem(params)
      .promise()
      .then(result => {
        console.log(result)
        console.log(newReferenceLinkID)
        response = {
          id: newReferenceLinkID,
          expirationTime: Number(expirationTime)
        }
      })
      .catch(err => {
        throw err
      })

    return response
  } catch (err) {
    console.log(err)
    var errString = ''
    if (err instanceof Error) {
      errString = err.toString()
    } else if (err instanceof Object) {
      errString = JSON.stringify(err)
    } else {
      errString = err
    }
    throw errString
  }
}

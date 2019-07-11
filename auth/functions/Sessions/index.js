var AWS = require('aws-sdk')
var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
var https = require('https')
const uuidv1 = require('uuid/v1')

exports.handler = async (event, context) => {
  console.log('EVENT: ' + JSON.stringify(event))
  console.log('CONTEXT: ' + JSON.stringify(context))
  try {
    var authDomain = process.env.AuthDomain
    var clientId = event.ClientId
    var clientSecret = ''
    var clientSecrets = process.env.ClientSecrets.split(',')
    var parsedClientSecret = ''
    for (var i = 0; i < clientSecrets.length; i++) {
      parsedClientSecret = JSON.parse(clientSecrets[i])
      if (parsedClientSecret[clientId]) {
        clientSecret = parsedClientSecret[clientId]
        break
      }
    }

    var token = ''
    var options = {
      hostname: authDomain,
      port: 443,
      path:
        '/oauth2/token?grant_type=authorization_code&client_id' +
        clientId +
        '&code=' +
        event.Code +
        '&redirect_uri=' +
        event.RedirectUri,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(clientId + ':' + clientSecret).toString('base64')
      }
    }
    await new Promise((resolve, reject) => {
      var req = https.request(options, res => {
        var responseBody = ''

        res.on('data', chunk => {
          console.log(chunk)
          responseBody += chunk
        })

        res.on('end', () => {
          console.log(responseBody)
          resolve(responseBody)
        })
      })

      req.on('error', error => {
        reject(error)
      })

      req.end()
    })
      .then(data => {
        token = JSON.parse(data)
      })
      .catch(err => {
        throw err
      })

    if (token.error) {
      throw token
    }

    //store token in sessions db
    //create epoch time for 60 minutes from now
    var ttl = (Math.floor(Date.now() / 1000) + 1 * 60 * 60).toString()
    var uuid = uuidv1()
    console.log(ttl)
    var params = {
      Item: {
        id: {
          S: uuid
        },
        token: {
          S: JSON.stringify(token)
        },
        refreshToken: { S: token.refresh_token },
        ttl: {
          N: ttl
        },
        clientId: {
          S: clientId
        },
        LastTokenRefresh: {
          N: Math.floor(Date.now() / 1000).toString()
        }
      },
      TableName: process.env.TableName
    }
    await dynamodb
      .putItem(params)
      .promise()
      .then(data => {})
      .catch(err => {
        throw err
      })
    return { sessionId: uuid }
  } catch (err) {
    console.log(err)
    //uncomment below to not respond to public with details of error
    err = 'Unexpected error.'
    if (err instanceof Error) {
      return err.toString()
    } else if (err instanceof Object) {
      return JSON.stringify(err)
    } else {
      return err
    }
  }
}

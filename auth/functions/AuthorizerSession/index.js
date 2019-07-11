var AWS = require('aws-sdk')
var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
  apiVersion: '2016-04-18'
})

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2))

  // A simple request-based authorizer example to demonstrate how to use request
  // parameters to allow or deny a request. In this example, a request is
  // authorized if the client-supplied HeaderAuth1 header, QueryString1
  // query parameter, and stage variable of StageVar1 all match
  // specified values of 'headerValue1', 'queryValue1', and 'stageValue1',
  // respectively.

  // Retrieve request parameters from the Lambda function input:
  var headers = event.headers
  !headers.SessionId ? (headers.SessionId = event.headers.sessionid) : false
  // var queryStringParameters = event.queryStringParameters
  // var pathParameters = event.pathParameters
  // var stageVariables = event.stageVariables
  // var body = event.body

  // Parse the input for the parameter values
  var tmp = event.methodArn.split(':')
  var apiGatewayArnTmp = tmp[5].split('/')
  // var awsAccountId = tmp[4]
  // var region = tmp[3]
  // var restApiId = apiGatewayArnTmp[0]
  // var stage = apiGatewayArnTmp[1]
  // var method = apiGatewayArnTmp[2]
  var resource = '/' // root resource
  if (apiGatewayArnTmp[3]) {
    resource += apiGatewayArnTmp[3]
  }

  // Perform authorization to return the Allow policy for correct parameters and
  // the 'Unauthorized' error, otherwise.

  // var condition = {}
  // condition.IpAddress = {}

  // if (headers.HeaderAuth1 === "headerValue1"
  //     && queryStringParameters.QueryString1 === "queryValue1"
  //     && stageVariables.StageVar1 === "stageValue1") {
  //     callback(null, generateAllow('me', event.methodArn));
  // }  else {
  //     callback("Unauthorized");
  // }
  try {
    // look up sessionid
    var refreshToken = ''
    var token = {}
    var clientId = ''
    var lastTokenRefresh = ''
    var params = {
      Key: {
        id: {
          S: headers.SessionId
        }
      },
      TableName: process.env.TableName
    }
    console.log('GET PARAMS: ' + JSON.stringify(params))
    await dynamodb
      .getItem(params)
      .promise()
      .then(data => {
        console.log(data)
        // token
        if (data.Item) {
          refreshToken = data.Item.refreshToken.S
          clientId = data.Item.clientId.S
          token = JSON.parse(data.Item.token.S)
          lastTokenRefresh = data.Item.LastTokenRefresh.N
        } else {
          // invalid session id
          throw 'Session Id not found.'
        }
      })
      .catch(err => {
        throw err
      })
    if (Math.floor(Date.now() / 1000) - lastTokenRefresh < 55 * 60) {
      // refresh session ttl
      var ttl = (Math.floor(Date.now() / 1000) + 1 * 60 * 60).toString()
      var params = {
        ExpressionAttributeNames: {
          '#TTL': 'ttl'
        },
        ExpressionAttributeValues: {
          ':t': {
            S: ttl
          }
        },
        Key: {
          id: {
            S: headers.SessionId
          }
        },
        TableName: process.env.TableName,
        UpdateExpression: 'SET #TTL = :t'
      }
      console.log(params)
      dynamodb
        .updateItem(params)
        .promise()
        .then(data => {})
        .catch(err => {
          console.log(err)
          // throw err
        })
      return generateAllow(headers.SessionId, event.methodArn, token.id_token)
    }
    // refresh token and store session information
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

    var params = {
      AuthFlow: 'REFRESH_TOKEN',
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: clientSecret
      }
    }
    console.log('INITIATE AUTH PARAMS: ' + JSON.stringify(params))
    await cognitoidentityserviceprovider
      .initiateAuth(params)
      .promise()
      .then(data => {
        console.log(data)
        if (!data) {
          throw 'Failed to refresh token.'
        }
        token.id_token = data.AuthenticationResult.IdToken
        token.expires_in = data.AuthenticationResult.ExpiresIn
        token.access_token = data.AuthenticationResult.AccessToken
        token.token_type = data.AuthenticationResult.TokenType
      })
      .catch(err => {
        throw err
      })

    // refresh sessionId ttl and store new token
    //store token in sessions db
    //create epoch time for 60 minutes from now
    var ttl = (Math.floor(Date.now() / 1000) + 1 * 60 * 60).toString()
    var params = {
      Item: {
        id: {
          S: headers.SessionId
        },
        token: {
          S: JSON.stringify(token)
        },
        refreshToken: {
          S: refreshToken
        },
        clientId: {
          S: clientId
        },
        ttl: {
          N: ttl
        },
        LastTokenRefresh: {
          N: Math.floor(Date.now() / 1000).toString()
        }
      },
      TableName: process.env.TableName
    }
    console.log(params)
    await dynamodb
      .putItem(params)
      .promise()
      .then(data => {})
      .catch(err => {
        throw err
      })

    if (token.id_token) {
      // return generateAllow('me', event.methodArn, token)
      // callback(null, generateAllow('me', event.methodArn, token.id_token))
      return generateAllow(headers.SessionId, event.methodArn, token.id_token)
    } else {
      throw 'Missing token.'
    }
  } catch (err) {
    console.log(err)
    return generateDeny(headers.SessionId, event.methodArn)
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

// Help function to generate an IAM policy
var generatePolicy = function(principalId, effect, resource, token) {
  // Required output:
  var authResponse = {}
  authResponse.principalId = principalId
  if (effect && resource) {
    var policyDocument = {}
    policyDocument.Version = '2012-10-17' // default version
    policyDocument.Statement = []
    var statementOne = {}
    statementOne.Action = 'execute-api:Invoke' // default action
    statementOne.Effect = effect
    statementOne.Resource = resource
    policyDocument.Statement[0] = statementOne
    authResponse.policyDocument = policyDocument
  }
  // Optional output with custom properties of the String, Number or Boolean type.
  if (effect === 'Allow') {
    authResponse.context = {
      Authorization: token
    }
  }

  return authResponse
}

var generateAllow = function(principalId, resource, token) {
  return generatePolicy(principalId, 'Allow', resource, token)
}

var generateDeny = function(principalId, resource, token) {
  return generatePolicy(principalId, 'Deny', resource, token)
}

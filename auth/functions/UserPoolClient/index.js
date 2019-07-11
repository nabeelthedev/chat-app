var AWS = require('aws-sdk')
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider()
var https = require('https')
var url = require('url')

exports.handler = async (event, context) => {
  console.log('EVENT: ' + JSON.stringify(event))
  console.log('CONTEXT: ' + JSON.stringify(context))
  var response = {
    PhysicalResourceId: event.PhysicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Status: 'FAILED',
    Reason: 'Unexpected error.',
    Data: {}
  }

  if (!event.PhysicalResourceId) {
    response.PhysicalResourceId = 'UserPoolClient-' + Date.now()
  }

  try {
    switch (event.RequestType) {
      case 'Create':
        var params = {
          UserPoolId: event.ResourceProperties.UserPoolId,
          AllowedOAuthFlowsUserPoolClient: JSON.parse(
            event.ResourceProperties.AllowedOAuthFlowsUserPoolClient
          ),
          AllowedOAuthFlows: event.ResourceProperties.AllowedOAuthFlows,
          AllowedOAuthScopes: event.ResourceProperties.AllowedOAuthScopes,
          CallbackURLs: event.ResourceProperties.CallbackURLs,
          LogoutURLs: event.ResourceProperties.LogoutURLs,
          SupportedIdentityProviders:
            event.ResourceProperties.SupportedIdentityProviders,
          ClientName: event.ResourceProperties.ClientName,
          GenerateSecret: JSON.parse(event.ResourceProperties.GenerateSecret)
        }

        await cognitoidentityserviceprovider
          .createUserPoolClient(params)
          .promise()
          .then(data => {
            response.Status = 'SUCCESS'
            response.Data.ClientSecret = JSON.stringify({
              [data.UserPoolClient.ClientId]: data.UserPoolClient.ClientSecret
            })
            response.NoEcho = true
            response.PhysicalResourceId =
              'UserPoolClient-' +
              data.UserPoolClient.ClientId +
              '-' +
              event.ResourceProperties.UserPoolId
          })
          .catch(err => {
            // response.Status = 'FAILED'
            // response.Reason = JSON.stringify(err)
            response.PhysicalResourceId =
              'FAILED-' + response.PhysicalResourceId
            throw err
          })
        break
      case 'Delete':
        if (event.PhysicalResourceId.split('-')[0] === 'FAILED') {
          response.Status = 'SUCCESS'
          break
        }
        var params = {
          ClientId: response.PhysicalResourceId.split('-')[1],
          UserPoolId: event.ResourceProperties.UserPoolId
        }

        await cognitoidentityserviceprovider
          .deleteUserPoolClient(params)
          .promise()
          .then(data => {
            response.Status = 'SUCCESS'
          })
          .catch(err => {
            // response.Status = 'FAILED'
            // response.Reason = JSON.stringify(err)
            throw err
          })
        break
      case 'Update':
        // response.Status = 'SUCCESS'
        var params = {
          UserPoolId: event.ResourceProperties.UserPoolId,
          ClientId: response.PhysicalResourceId.split('-')[1],
          AllowedOAuthFlowsUserPoolClient: JSON.parse(
            event.ResourceProperties.AllowedOAuthFlowsUserPoolClient
          ),
          AllowedOAuthFlows: event.ResourceProperties.AllowedOAuthFlows,
          AllowedOAuthScopes: event.ResourceProperties.AllowedOAuthScopes,
          CallbackURLs: event.ResourceProperties.CallbackURLs,
          LogoutURLs: event.ResourceProperties.LogoutURLs,
          SupportedIdentityProviders:
            event.ResourceProperties.SupportedIdentityProviders,
          ClientName: event.ResourceProperties.ClientName
        }

        await cognitoidentityserviceprovider
          .updateUserPoolClient(params)
          .promise()
          .then(data => {
            response.Status = 'SUCCESS'
            response.Data.ClientSecret = JSON.stringify({
              [data.UserPoolClient.ClientId]: data.UserPoolClient.ClientSecret
            })
            response.NoEcho = true
            response.PhysicalResourceId =
              'UserPoolClient-' +
              data.UserPoolClient.ClientId +
              '-' +
              event.ResourceProperties.UserPoolId
          })
          .catch(err => {
            // response.Status = 'FAILED'
            // response.Reason = JSON.stringify(err)
            throw err
          })
    }
  } catch (err) {
    response.Status = 'FAILED'
    console.log(err)
    if (err instanceof Error) {
      response.Reason = err.toString()
    } else if (err instanceof Object) {
      response.Reason = JSON.stringify(err)
    } else {
      response.Reason = err
    }
  }

  var responseBody = JSON.stringify(response)
  console.log(responseBody)

  var parsedUrl = url.parse(event.ResponseURL)
  var options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'Content-Type': '',
      'Content-Length': Buffer.byteLength(responseBody)
    }
  }

  return new Promise((resolve, reject) => {
    var requestResponse = ''
    var req = https.request(options, res => {
      res.on('data', chunk => {
        requestResponse += chunk
      })
      res.on('end', () => {
        resolve(requestResponse)
      })
    })

    req.on('error', error => {
      reject(error)
    })
    req.write(responseBody)
    req.end()
  })
}

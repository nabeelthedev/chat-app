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
    response.PhysicalResourceId =
      'UserPoolDomain-' + event.ResourceProperties.UserPoolId + '-' + Date.now()
  }

  try {
    switch (event.RequestType) {
      case 'Create':
        var params = {
          Domain: event.ResourceProperties.Domain,
          UserPoolId: event.ResourceProperties.UserPoolId
        }
        if (event.ResourceProperties.CustomDomainConfig.CertificateArn) {
          params.CustomDomainConfig =
            event.ResourceProperties.CustomDomainConfig
        }

        await cognitoidentityserviceprovider
          .createUserPoolDomain(params)
          .promise()
          .then(data => {
            response.Status = 'SUCCESS'
            // response.Data = data
            if (!event.ResourceProperties.CustomDomainConfig.CertificateArn) {
              response.Data.Domain =
                event.ResourceProperties.Domain +
                '.auth.' +
                process.env.AWS_REGION +
                '.amazoncognito.com'
            } else {
              response.Data.Domain = event.ResourceProperties.Domain
            }
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
          Domain: event.ResourceProperties.Domain,
          UserPoolId: event.ResourceProperties.UserPoolId
        }

        await cognitoidentityserviceprovider
          .deleteUserPoolDomain(params)
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
        response.Status = 'SUCCESS'
      // var params = {
      //   Domain: event.ResourceProperties.Domain,
      //   UserPoolId: event.ResourceProperties.UserPoolId
      // }
      // if (event.ResourceProperties.CustomDomainConfig.CertificateArn) {
      //   params.CustomDomainConfig =
      //     event.ResourceProperties.CustomDomainConfig
      // }

      // await cognitoidentityserviceprovider
      //   .updateUserPoolDomain(params)
      //   .promise()
      //   .then(data => {
      //     response.Status = 'SUCCESS'
      //     // response.Data = data
      //     if (!event.ResourceProperties.CustomDomainConfig.CertificateArn) {
      //       response.Data.Domain =
      //         event.ResourceProperties.Domain +
      //         '.auth.' +
      //         process.env.AWS_REGION +
      //         '.amazoncognito.com'
      //     } else {
      //       response.Data.Domain = event.ResourceProperties.Domain
      //     }
      //   })
      //   .catch(err => {
      //     // response.Status = 'FAILED'
      //     // response.Reason = JSON.stringify(err)
      //     throw err
      //   })
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
  console.log('RESPONSE BODY: ' + responseBody)

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

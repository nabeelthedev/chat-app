var AWS = require('aws-sdk')
var wafregional = new AWS.WAFRegional({ apiVersion: '2016-11-28' })
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
    response.PhysicalResourceId = 'WAFWebACLUpdateRule-' + Date.now()
  }

  try {
    var changeToken = ''
    await wafregional
      .getChangeToken()
      .promise()
      .then(data => {
        // response.Status = 'SUCCESS'
        // response.Data = data
        changeToken = data.ChangeToken
      })
      .catch(err => {
        // console.log(err)
        throw err
      })

    switch (event.RequestType) {
      case 'Create':
        var params = {
          ChangeToken: changeToken,
          WebACLId: event.ResourceProperties.WebACLId,
          Updates: event.ResourceProperties.Updates
        }

        for (var i = 0; i < params.Updates.length; i++) {
          params.Updates[i].Action = 'INSERT'
        }

        await wafregional
          .updateWebACL(params)
          .promise()
          .then(data => {
            response.Status = 'SUCCESS'
            // response.Data = data
          })
          .catch(err => {
            // response.Status = 'FAILED'
            // response.Reason = JSON.stringify(err)
            // console.log(err)
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
          ChangeToken: changeToken,
          WebACLId: event.ResourceProperties.WebACLId,
          Updates: event.ResourceProperties.Updates
        }

        for (var i = 0; i < params.Updates.length; i++) {
          params.Updates[i].Action = 'DELETE'
        }

        await wafregional
          .updateWebACL(params)
          .promise()
          .then(data => {
            response.Status = 'SUCCESS'
            // response.Data = data
          })
          .catch(err => {
            // response.Status = 'FAILED'
            // response.Reason = JSON.stringify(err)
            // console.log(err)
            throw err
          })
        break
      case 'Update':
        var params = {
          ChangeToken: changeToken,
          WebACLId: event.ResourceProperties.WebACLId,
          Updates: []
        }

        for (var i = 0; i < event.OldResourceProperties.Updates.length; i++) {
          event.OldResourceProperties.Updates[i].Action = 'DELETE'
          params.Updates.push(event.OldResourceProperties.Updates[i])
        }
        for (var i = 0; i < event.ResourceProperties.Updates.length; i++) {
          event.ResourceProperties.Updates[i].Action = 'INSERT'
          params.Updates.push(event.ResourceProperties.Updates[i])
        }

        await wafregional
          .updateWebACL(params)
          .promise()
          .then(data => {
            response.Status = 'SUCCESS'
            response.Data = data
          })
          .catch(err => {
            // response.Status = 'FAILED'
            // response.Reason = JSON.stringify(err)
            // console.log(err)
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

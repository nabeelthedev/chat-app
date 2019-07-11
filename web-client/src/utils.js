export const httpReq = (input, callback) => {
  var xhr = new XMLHttpRequest()
  xhr.open(input.method, input.url, true)
  if (input.headers) {
    for (var i = 0; i < input.headers.length; i++) {
      xhr.setRequestHeader(input.headers[i][0], input.headers[i][1])
    }
  }

  xhr.onreadystatechange = function() {
    // Call a function when the state changes.
    if (this.readyState === XMLHttpRequest.DONE) {
      callback(this)
    }
  }
  xhr.send(input.body)
}

export const isAuthenticated = () => {
  return localStorage.getItem('sessionId') ? true : false
}

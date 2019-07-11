import React, { Component } from 'react'

export default class Messages extends Component {
  constructor(props) {
    super(props)
    this.state = {
      messages: { items: [], nextToken: null },
      toggleLoading: false,
      messageInput: '',
      scrolledToBottom: true,
      visibility: false
    }
    this.listMessages = this.listMessages.bind(this)
    this.postMessage = this.postMessage.bind(this)
    this.messageInputUpdate = this.messageInputUpdate.bind(this)
  }
  componentDidMount() {
    this.listMessages()
    document.body.style.paddingBottom = '60px'
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.visibility &&
      this.state.scrolledToBottom &&
      prevState.messages !== this.state.messages
    ) {
      window.scrollTo(0, document.body.scrollHeight)
    }
    if (prevState.visibility !== this.state.visibility) {
      // window.scrollTop = window.scrollHeight
      window.scrollTo(0, document.body.scrollHeight)
    }
  }

  render() {
    return (
      <div>
        <div
          className="card groups"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            $('.groups').addClass('d-none')
            $('#nav-home').addClass('d-none')
            $('#' + this.props.id).removeClass('d-none')
            this.setState({ visibility: true })
          }}
        >
          <div className="card-body">{this.props.name}</div>
        </div>
        <div id={this.props.id} className="d-none">
          <nav
            className="navbar bg-light navbar-light fixed-top"
            style={{ boxShadow: '0px 2px 10px grey' }}
          >
            <ul className="navbar-nav">
              <li className="nav-item active">
                <a
                  className="nav-link"
                  href="#"
                  onClick={() => {
                    $('#' + this.props.id).addClass('d-none')
                    $('.groups').removeClass('d-none')
                    $('#nav-home').removeClass('d-none')
                    this.setState({ visibility: false })
                  }}
                >
                  Back <span className="sr-only">(current)</span>
                </a>
              </li>
            </ul>
          </nav>
          <div id={this.props.id + '-messages'}>
            {this.state.messages.items.length !== 0 ? (
              this.state.messages.items.map(x => (
                <div className="card">
                  <div className="card-body" style={{ whiteSpace: 'pre' }}>
                    {x.message.replace(/\/\n\//g, '\n')}
                  </div>
                </div>
              ))
            ) : (
              <div className="card">
                <div className="card-body">
                  {this.state.toggleLoading
                    ? 'Loading...'
                    : 'There are no messages.'}
                </div>
              </div>
            )}
          </div>
          <div className="input-group fixed-bottom">
            <textarea
              className="form-control float-left"
              onChange={this.messageInputUpdate}
              value={this.state.messageInput}
            />
            <div className="input-group-append">
              <button
                type="button"
                className="btn btn-primary float-right"
                onClick={this.postMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  messageInputUpdate(e) {
    this.setState({ messageInput: e.target.value })
  }
  listMessages() {
    var self = this
    var xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://api.dnqr.xyz/chat', true)

    //Send the proper header information along with the request
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('SessionId', localStorage.getItem('sessionId'))

    xhr.onreadystatechange = function() {
      // Call a function when the state changes.
      if (this.readyState === XMLHttpRequest.DONE) {
        switch (this.status) {
          case 200:
            console.log(this.responseText)
            var parsedResponse = JSON.parse(this.responseText).data.listMessages
            self.setState(prevState => ({
              messages: {
                items: prevState.messages.items.concat(parsedResponse.items),
                nextToken: parsedResponse.nextToken
              }
            }))
            break
          case 403:
            localStorage.clear()
            self.props.history.push('/signin')
            break
        }
        // self.setState(prevState => ({
        //   toggleLoading: !prevState.toggleLoading
        // }))
      }
    }
    var query
    this.state.messages.nextToken
      ? (query =
          'query{listMessages(groupId: "' +
          self.props.id +
          '",nextToken:"' +
          this.state.messages.nextToken +
          '"){items{id, message, CreateTime, author}, nextToken}}')
      : (query =
          'query{listMessages(groupId: "' +
          self.props.id +
          '"){items{id, message, CreateTime, author}, nextToken}}')
    xhr.send(
      JSON.stringify({
        query: query
      })
    )
  }
  postMessage() {
    // this.setState(prevState => ({ toggleLoading: !prevState.toggleLoading }))
    var self = this
    var xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://api.dnqr.xyz/chat', true)

    //Send the proper header information along with the request
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('SessionId', localStorage.getItem('sessionId'))

    xhr.onreadystatechange = function() {
      // console.log(this.status)
      // Call a function when the state changes.
      if (this.readyState === XMLHttpRequest.DONE) {
        switch (this.status) {
          case 200:
            console.log(this.responseText)
            var parsedResponse = JSON.parse(this.responseText).data.postMessage
            self.setState(prevState => ({
              messages: {
                items: prevState.messages.items.concat([parsedResponse]),
                nextToken: prevState.nextToken
              },
              messageInput: ''
            }))

            // self.props.updateGroups([parsedResponse.data.createGroup])
            break
          case 403:
            localStorage.clear()
            self.props.history.push('/signin')
            break
        }
        // self.setState(prevState => ({
        //   toggleLoading: !prevState.toggleLoading
        // }))
      }
    }
    console.log(self.state.messageInput.replace(/\n/g, /\\n/))
    xhr.send(
      JSON.stringify({
        query:
          'mutation{postMessage(groupId: "' +
          self.props.id +
          '", message:"' +
          self.state.messageInput.replace(/\n/g, /\\n/) +
          '"){id, message, CreateTime, author}}'
      })
    )
  }
}

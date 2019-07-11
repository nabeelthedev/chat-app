import React, { Component } from 'react'
import Message from './Message'
import { API } from 'aws-amplify'
import mobile from 'is-mobile'
import GetReferenceLink from '../components/GetReferenceLink'

export default class Group extends Component {
  constructor(props) {
    super(props)
    this.state = {
      messages: { items: [], nextToken: null, afterToken: null },
      messagesVisibility: false,
      toggleMessagesVisibility: () => {
        this.setState(prevState => ({
          messagesVisibility: !prevState.messagesVisibility
        }))
      },
      messageInput: '',
      messageInputUpdate: e => {
        this.setState({ messageInput: e.target.value })
      },
      scrolledToBottom: true,
      scrolledToTop: null,
      scrollEvent: false,
      updateScrollEvent: () => {
        this.setState({ scrollEvent: true })
      },
      subToNewMessages: null,
      newMessagesAlert: false,
      ariaExpanded: false
    }
    this.listMessages = this.listMessages.bind(this)
    this.postMessage = this.postMessage.bind(this)
    this.messageInputUpdate = this.messageInputUpdate.bind(this)
    this.subToNewMessages = this.subToNewMessages.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
    this.onEnterKeypress = this.onEnterKeypress.bind(this)
    this.navbarClickListener = this.navbarClickListener.bind(this)
    this.goBack = this.goBack.bind(this)
  }
  componentDidMount() {
    this.listMessages()
  }
  componentWillUnmount() {
    this.state.subToNewMessages && this.state.subToNewMessages.unsubscribe()
  }
  componentDidUpdate(prevProps, prevState) {
    //listen for scroll events when this groups message list is visible
    if (this.state.messagesVisibility !== prevState.messagesVisibility) {
      this.messageList.scrollTop = this.messageList.scrollHeight
      if (this.state.messagesVisibility) {
        this.messageList.addEventListener(
          'scroll',
          this.state.updateScrollEvent
        )
        this.state.messages.items.length > 0
          ? this.listMessages(
              this.state.messages.items[this.state.messages.items.length - 1]
                .CreateTime
            )
          : this.listMessages(0)
      } else {
        this.messageList.removeEventListener(
          'scroll',
          this.state.updateScrollEvent
        )
        $('.collapse').collapse('hide')
        this.setState({ ariaExpanded: false })
      }
    }
    if (
      this.state.messages.afterToken !== prevState.messages.afterToken &&
      this.state.messages.afterToken
    ) {
      this.listMessages(true)
    }
    // list more messages when scrolled to top
    if (
      this.state.scrolledToTop !== prevState.scrolledToTop &&
      this.state.messages.nextToken &&
      this.state.scrolledToTop
    ) {
      this.listMessages()
    }
    if (!this.state.scrolledToTop && this.messageList.scrollTop === 0) {
      this.setState({ scrolledToTop: true })
    }
    if (this.state.scrolledToTop && this.messageList.scrollTop !== 0) {
      this.setState({ scrolledToTop: false })
    }
    // set scroll state when NOT scrolled to bottom
    if (
      this.state.scrollEvent !== prevState.scrollEvent &&
      this.state.scrolledToBottom &&
      Math.ceil(this.messageList.scrollHeight - this.messageList.scrollTop) >
        this.messageList.clientHeight + this.messageList.clientHeight * 0.01
    ) {
      this.setState({ scrolledToBottom: false })
    }
    // set scroll state when scrolled to bottom
    if (
      this.state.scrollEvent !== prevState.scrollEvent &&
      !this.state.scrolledToBottom &&
      Math.ceil(this.messageList.scrollHeight - this.messageList.scrollTop) <=
        this.messageList.clientHeight + this.messageList.clientHeight * 0.01
    ) {
      this.setState({ scrolledToBottom: true, newMessagesAlert: false })
    }
    // scroll down for new messages
    if (
      this.state.messagesVisibility &&
      this.state.scrolledToBottom &&
      this.state.messages !== prevState.messages
    ) {
      this.scrollToBottom()
    }
    if (this.state.scrollEvent) {
      this.setState({ scrollEvent: false })
    }
    if (
      this.state.messagesVisibility !== prevState.messagesVisibility &&
      this.state.messagesVisibility
    ) {
      // user opened this group
      this.subToNewMessages()
    }
    if (
      this.state.messagesVisibility !== prevState.messagesVisibility &&
      !this.state.messagesVisibility
    ) {
      // user went back to group list
      this.state.subToNewMessages && this.state.subToNewMessages.unsubscribe()
    }
    // alert user new messages have arrived when not scrolled to bottom
    // if (
    //   this.state.messages !== prevState.messages &&
    //   !this.state.scrolledToBottom
    // ) {
    //   this.setState({ newMessagesAlert: true })
    // }
    //
    if (
      this.state.messagesVisibility !== prevState.messagesVisibility &&
      this.state.messagesVisibility
    ) {
      document.addEventListener('click', this.navbarClickListener)
    }
    if (
      this.state.messagesVisibility !== prevState.messagesVisibility &&
      !this.state.messagesVisibility
    ) {
      document.removeEventListener('click', this.navbarClickListener)
    }
  }

  render() {
    return (
      <div>
        <div
          className="card"
          style={{
            cursor: 'pointer',
            display: `${this.props.groupsVisibility ? 'block' : 'none'}`
          }}
          onClick={() => {
            this.props.toggleGroupsVisibility()
            this.props.updateContainerPadding('64px 0px 68px 0px')
            this.state.toggleMessagesVisibility()
          }}
        >
          <div className="card-body">
            <h5 className="card-title mb-0">{this.props.group.name}</h5>
          </div>
        </div>
        <div
          ref={div => {
            this.messageList = div
          }}
          style={{
            display: `${this.state.messagesVisibility ? 'block' : 'none'}`,
            maxHeight: `${this.props.window.height - 132 + 'px'}`,
            overflowY: 'auto'
          }}
        >
          <nav
            className="navbar navbar-expand-md navbar-light bg-light fixed-top"
            style={{ boxShadow: '0px 2px 10px grey' }}
          >
            <ul className="nav navbar-nav mr-2">
              <li class="nav-item">
                <a
                  className=" nav-link"
                  href="javascript:void(0)"
                  onClick={this.goBack}
                >
                  Back
                </a>
              </li>
            </ul>
            <button
              class="navbar-toggler"
              type="button"
              data-toggle="collapse"
              data-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
              onClick={() => {
                this.setState(prevState => ({
                  ariaExpanded: !prevState.ariaExpanded
                }))
              }}
            >
              <span class="navbar-toggler-icon" />
            </button>
            <div
              className="collapse navbar-collapse navbar-right"
              id="navbarNav"
            >
              <ul className="nav navbar-nav">
                <li className="nav-item mt-4">
                  <GetReferenceLink value={this.props.group.id} type="GROUP" />
                </li>
              </ul>
            </div>
          </nav>
          {this.state.messages.items.length > 0 ? (
            this.state.messages.items.map(x => (
              <Message key={x.id} message={x} />
            ))
          ) : (
            <div className="card">
              <div className="card-body">No Messages.</div>
            </div>
          )}
          <div className="fixed-bottom">
            <div
              className="alert alert-primary text-center"
              style={{
                display: this.state.newMessagesAlert ? 'block' : 'none',
                cursor: 'pointer'
              }}
              role="alert"
              onClick={this.scrollToBottom}
            >
              New Messages
            </div>
            <div className="input-group">
              <textarea
                className="form-control float-left"
                onChange={this.messageInputUpdate}
                value={this.state.messageInput}
                onKeyPress={this.onEnterKeypress}
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
      </div>
    )
  }

  goBack() {
    this.state.toggleMessagesVisibility()
    this.props.updateContainerPadding('64px 0px 0px 0px')
    this.props.toggleGroupsVisibility()
  }

  navbarClickListener(e) {
    if (this.state.ariaExpanded) {
      var nav
      e.target.localName === 'nav' ? (nav = true) : false
      if (!nav) {
        var parents = e.path
        for (var i = 0; i < parents.length; i++) {
          if (parents[i].localName === 'nav') {
            nav = true
            break
          }
        }
      }
      if (!nav) {
        $('.collapse').collapse('hide')
        this.setState(prevState => ({
          ariaExpanded: !prevState.ariaExpanded
        }))
      }
    }
  }

  messageInputUpdate(e) {
    this.setState({ messageInput: e.target.value })
  }

  scrollToBottom() {
    this.messageList.scrollTop = Math.ceil(
      this.messageList.scrollHeight - this.messageList.clientHeight
    )
    this.setState({
      scrolledToBottom: true,
      newMessagesAlert: false
    })
  }

  onEnterKeypress(e) {
    var key = e.which || e.keyCode
    if (key === 13 && !e.shiftKey && !mobile()) {
      // 13 is enter
      // code for enter
      e.preventDefault()
      this.postMessage()
    }
  }

  listMessages(afterInput) {
    var groupId = this.props.group.id
    var nextToken,
      after = afterInput
    !after
      ? (nextToken = this.state.messages.nextToken)
      : (nextToken = this.state.messages.afterToken)
    after === true && (after = null)
    var query = `query ListMessages($groupId: ID!, $nextToken: String, $after: Int) {
      listMessages(groupId: $groupId, nextToken: $nextToken, after: $after){items{id, CreateTime, message, author, DisplayName}, nextToken}
    }`
    API.graphql({
      query: query,
      variables: { groupId: groupId, nextToken: nextToken, after: after }
    })
      .then(response => {
        console.log(response)

        var newArray = [
          ...this.state.messages.items,
          ...response.data.listMessages.items
        ]
        var sortedArray = newArray.sort((a, b) => {
          return a.CreateTime - b.CreateTime
        })
        var nextToken, afterToken
        if (!afterInput) {
          nextToken = response.data.listMessages.nextToken
          afterToken = this.state.messages.afterToken
        } else {
          nextToken = this.state.messages.nextToken
          afterToken = response.data.listMessages.nextToken
        }
        var oldScrollHeight = this.messageList.scrollHeight
        this.setState(
          prevState => ({
            messages: {
              items: sortedArray,
              nextToken: nextToken,
              afterToken: afterToken
            }
          }),
          () => {
            if (this.state.scrolledToTop) {
              this.messageList.scrollTop =
                this.messageList.scrollHeight - oldScrollHeight
            }
          }
        )
        // after && this.listMessages()
      })
      .catch(error => {
        console.log(error)
      })
  }

  postMessage() {
    if (this.state.messageInput.length < 1) {
      return
    }
    var groupId = this.props.group.id
    var message = this.state.messageInput
    message = message.replace(/\n/g, '\\n')
    var query = `mutation PostMessage($groupId: ID!, $message: String!) {
  postMessage(groupId: $groupId, message: $message){id, CreateTime, message, author, groupId, DisplayName}
}`

    API.graphql({
      query: query,
      variables: { groupId: groupId, message: message }
    })
      .then(response => {
        console.log(response)
        this.setState(prevState => ({
          messages: {
            items: prevState.messages.items.concat(
              [response.data.postMessage].filter(
                x =>
                  prevState.messages.items.findIndex(y => y.id === x.id) === -1
              )
            ),
            nextToken: prevState.messages.nextToken
          }
        }))
      })
      .catch(error => {
        console.log(error)
      })
    this.setState({ messageInput: '', scrolledToBottom: true })
  }

  subToNewMessages() {
    var groupId = this.props.group.id

    const subscription = API.graphql({
      query: `subscription PostedMessage($groupId: ID!) {
        postedMessage(groupId: $groupId){id, CreateTime, message, author, DisplayName}
      }`,
      variables: { groupId: groupId }
    }).subscribe({
      next: data => {
        console.log(data)
        var newMessagesAlert
        this.state.scrolledToBottom
          ? (newMessagesAlert = this.state.newMessagesAlert)
          : (newMessagesAlert = true)
        this.setState(prevState => ({
          messages: {
            items: prevState.messages.items.concat(
              [data.value.data.postedMessage].filter(
                x =>
                  prevState.messages.items.findIndex(y => y.id === x.id) === -1
              )
            ),
            nextToken: prevState.messages.nextToken
          },
          newMessagesAlert: newMessagesAlert
        }))
      },
      complete: data => {
        console.log(data)
      },
      error: error => {
        this.goBack()
      }
    })
    this.setState({ subToNewMessages: subscription })
  }
}

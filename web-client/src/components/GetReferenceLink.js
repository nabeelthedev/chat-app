import React, { Component } from 'react'
import { API } from 'aws-amplify'

export default class GetReferenceLink extends Component {
  constructor(props) {
    super(props)
    this.state = {
      referenceLink: { id: null, expirationTime: null },
      toggleLoading: false
    }
    this.getReferenceLink = this.getReferenceLink.bind(this)
    this.copyToClipboard = this.copyToClipboard.bind(this)
    this.referenceLinkIdText = React.createRef()
  }

  getReferenceLink() {
    this.setState(prevState => ({ toggleLoading: !prevState.toggleLoading }))
    if (this.checkReferenceLink()) {
      this.setState(
        prevState => ({ toggleLoading: !prevState.toggleLoading }),
        this.copyToClipboard
      )
      return
    }
    var value = this.props.value
    var type = this.props.type
    var query = `mutation CreateReferenceLink($value: ID, $type: ReferenceLinkType!) {
      createReferenceLink(value: $value, type: $type){id, expirationTime}
}`

    API.graphql({
      query: query,
      variables: { value: value, type: type }
    })
      .then(response => {
        console.log(response)
        const parsedUrl = new URL(window.location.href)

        this.setState(prevState => ({
          referenceLink: {
            id:
              parsedUrl.origin +
              '/?joinGroup=' +
              response.data.createReferenceLink.id,
            expirationTime: response.data.createReferenceLink.expirationTime
          }
        }))
      })
      .catch(error => {
        console.log(error)
      })
      .finally(() => {
        this.setState(prevState => ({
          toggleLoading: !prevState.toggleLoading
        }))
      })
  }

  checkReferenceLink() {
    if (
      this.state.referenceLink.id &&
      this.state.referenceLink.expirationTime - Math.floor(Date.now() / 1000) >
        60 * 5
    ) {
      return true
    } else {
      return false
    }
  }

  componentDidMount() {
    $('[data-toggle="popover"]').popover({ trigger: 'manual' })
    this.checkReferenceLink()
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.referenceLink !== prevState.referenceLink) {
      this.copyToClipboard()
    }
  }

  copyToClipboard(e) {
    this.referenceLinkIdText.current.select()
    console.log(this.referenceLinkIdText.value)
    document.execCommand('copy')
    $('[data-toggle="popover"]').popover('show')
    setTimeout(function() {
      $('[data-toggle="popover"]').popover('hide')
    }, 4000)
  }

  render() {
    return (
      <div className="input-group">
        <div className="input-group-prepend">
          <button
            className="btn btn-outline-secondary"
            onClick={this.getReferenceLink}
            disabled={this.state.toggleLoading}
            type="button"
          >
            {this.state.referenceLink.id
              ? 'Copy Invite Link'
              : this.state.toggleLoading
              ? 'Loading...'
              : 'Copy Invite Link'}
          </button>
        </div>
        <input
          className="form-control"
          ref={this.referenceLinkIdText}
          value={this.state.referenceLink.id}
          data-toggle="popover"
          data-content="Copied."
          type="text"
        />
      </div>
    )
  }
}

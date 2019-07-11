import React, { Component } from 'react'
import { httpReq } from '../utils'
import { API } from 'aws-amplify'

export default class GetGroupInviteLink extends Component {
  constructor(props) {
    super(props)
    this.state = { inviteLink: 'Loading...', toggleLoading: false }
    this.getGroupInviteLink = this.getGroupInviteLink.bind(this)
  }

  getGroupInviteLink() {
    this.setState(prevState => ({ toggleLoading: !prevState.toggleLoading }))
    var displayName = this.state.displayNameInput
    var query = `mutation CreateReferenceLink($value: String!) {
      createReferenceLink(value: $value){id, expirationTime}
}`

    API.graphql({
      query: query,
      variables: { displayName: displayName }
    })
      .then(response => {
        console.log(response)
        this.setState(prevState => ({
          inviteLink: response.data.createReferenceLink.id
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

  componentDidMount() {}

  render() {
    return (
      <div
        className="modal"
        tabindex="-1"
        role="dialog"
        id="getGroupInviteLinkModal"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Invite People</h4>
              <button type="button" className="close" data-dismiss="modal">
                &times;
              </button>
            </div>

            <div className="modal-body">
              <input
                readonly
                type="text"
                className="form-control"
                placeholder="Display Name..."
                value={this.state.inviteLink}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={this.state.toggleLoading ? true : false}
              >
                Copy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  copyToClipboard(e) {
    this.referenceLinkIdText.current.select()
    document.execCommand('copy')
    $('[data-toggle="popover"]').popover('show')
    setTimeout(function() {
      $('[data-toggle="popover"]').popover('hide')
    }, 4000)
  }
}

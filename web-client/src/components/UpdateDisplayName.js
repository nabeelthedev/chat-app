import React, { Component } from 'react'
import { httpReq } from '../utils'
import { API } from 'aws-amplify'

export default class UpdateDisplayName extends Component {
  constructor(props) {
    super(props)
    this.state = { displayNameInput: '', toggleLoading: false }
    this.displayNameUpdate = this.displayNameUpdate.bind(this)
    this.updateDisplayName = this.updateDisplayName.bind(this)
  }

  updateDisplayName() {
    if (this.state.displayNameInput.length < 1) {
      return
    }
    this.setState(prevState => ({ toggleLoading: !prevState.toggleLoading }))
    var displayName = this.state.displayNameInput
    var query = `mutation UpdateDisplayName($displayName: String!) {
  updateDisplayName(displayName: $displayName){displayName}
}`

    API.graphql({
      query: query,
      variables: { displayName: displayName }
    })
      .then(response => {
        console.log(response)
        $('#updateDisplayNameModal').modal('hide')
        this.setState(prevState => ({
          displayNameInput: ''
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

  displayNameUpdate(e) {
    this.setState({ displayNameInput: e.target.value })
  }

  render() {
    return (
      <div
        className="modal"
        tabindex="-1"
        role="dialog"
        id="updateDisplayNameModal"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Change Display Name</h4>
              <button type="button" className="close" data-dismiss="modal">
                &times;
              </button>
            </div>

            <div className="modal-body">
              <input
                type="text"
                className="form-control"
                placeholder="Display Name..."
                onChange={this.displayNameUpdate}
                value={this.state.displayNameInput}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-success"
                onClick={this.updateDisplayName}
                disabled={this.state.toggleLoading ? true : false}
              >
                {this.state.toggleLoading ? 'Loading' : 'Update'}
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
}

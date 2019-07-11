import React, { Component } from 'react'
import { API } from 'aws-amplify'

export default class CreateGroup extends Component {
  constructor(props) {
    super(props)
    this.state = { groupNameInput: '', toggleLoading: false }
    this.groupNameUpdate = this.groupNameUpdate.bind(this)
    this.createGroup = this.createGroup.bind(this)
  }

  createGroup() {
    this.setState(prevState => ({ toggleLoading: !prevState.toggleLoading }))
    var name = this.state.groupNameInput
    var query = `mutation CreateGroup($name: String) {
    createGroup(name: $name){id, name}
  }`

    API.graphql({
      query: query,
      variables: { name: name }
    })
      .then(response => {
        console.log(response)
        this.props.updateGroups(response.data.createGroup)
      })
      .catch(error => {
        console.log(error)
      })
      .finally(() => {
        this.setState(prevState => ({
          toggleLoading: !prevState.toggleLoading,
          groupNameInput: ''
        }))
        $('#createGroupModal').modal('hide')
      })
  }

  componentDidMount() {}

  groupNameUpdate(e) {
    this.setState({ groupNameInput: e.target.value })
  }

  render() {
    return (
      <div className="modal" tabindex="-1" role="dialog" id="createGroupModal">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Create Group</h4>
              <button type="button" className="close" data-dismiss="modal">
                &times;
              </button>
            </div>

            <div className="modal-body">
              <input
                type="text"
                className="form-control"
                placeholder="Group Name..."
                onChange={this.groupNameUpdate}
                value={this.state.groupNameInput}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-success"
                onClick={this.createGroup}
                disabled={this.state.toggleLoading ? true : false}
              >
                {this.state.toggleLoading ? 'Loading' : 'Create Group'}
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

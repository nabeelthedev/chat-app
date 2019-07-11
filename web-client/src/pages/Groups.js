import React, { Component } from 'react'
import Group from '../components/Group'
import NavBar from '../components/NavBar2'
import CreateGroup from '../components/CreateGroup'
import UpdateDisplayName from '../components/UpdateDisplayName'

import Amplify, { API } from 'aws-amplify'

Amplify.configure({
  API: {
    graphql_endpoint: 'https://api.dnqr.xyz/chat',
    graphql_headers: async () => ({
      SessionId: localStorage.getItem('sessionId')
    })
  }
})

export default class Groups extends Component {
  constructor(props) {
    super(props)
    this.state = {
      toggleLoading: false,
      groups: { items: [], nextToken: null },
      visibility: true,
      toggleVisibility: () => {
        this.state.visibility
          ? this.setState({
              scrollPosition: this.groupsList.scrollTop
            })
          : false
        this.setState(prevState => ({
          visibility: !prevState.visibility
        }))
      },
      containerPadding: '64px 0px 0px 0px',
      updateContainerPadding: value => {
        this.setState({ containerPadding: value })
      },
      window: { width: window.innerWidth, height: window.innerHeight },
      scrollPosition: 0
    }
    this.listGroups = this.listGroups.bind(this)
    this.updateGroups = this.updateGroups.bind(this)
    this.updateDimensions = this.updateDimensions.bind(this)
  }

  render() {
    return (
      <div
        className="container-fluid"
        style={{
          padding: this.state.containerPadding
        }}
      >
        <NavBar visibility={this.state.visibility} history={this.props.history}>
          <a
            className="btn btn-primary w-75"
            type="button"
            href="javascript:void(0)"
            data-toggle="modal"
            data-target="#createGroupModal"
          >
            Create Group
          </a>
          <a
            className="btn btn-primary w-75"
            type="button"
            href="javascript:void(0)"
            data-toggle="modal"
            data-target="#updateDisplayNameModal"
          >
            Change Display Name
          </a>
        </NavBar>
        <div
          ref={div => {
            this.groupsList = div
          }}
          style={{
            maxHeight: `${this.state.window.height - 64 + 'px'}`,
            overflowY: 'auto'
          }}
        >
          {this.state.groups.items.length !== 0 ? (
            this.state.groups.items.map(x => (
              <Group
                key={x.id}
                group={x}
                toggleGroupsVisibility={this.state.toggleVisibility}
                groupsVisibility={this.state.visibility}
                updateContainerPadding={this.state.updateContainerPadding}
                window={this.state.window}
              />
            ))
          ) : (
            <div className="card">
              <div className="card-body">
                {this.state.toggleLoading
                  ? 'Loading...'
                  : 'You have no groups.'}
              </div>
            </div>
          )}
        </div>
        <CreateGroup
          history={this.props.history}
          updateGroups={this.updateGroups}
        />
        <UpdateDisplayName />
      </div>
    )
  }

  componentDidMount() {
    this.initUser()
    this.listGroups()
    window.addEventListener('resize', this.updateDimensions)
    // check for joingroup param
    this.joinGroup()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions)
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      this.state.groups.nextToken !== prevState.groups.nextToken &&
      this.state.groups.nextToken
    ) {
      this.listGroups()
    } else if (
      this.state.groups.nextToken !== prevState.groups.nextToken &&
      !this.state.groups.nextToken
    ) {
      this.setState(prevState => ({ toggleLoading: !prevState.toggleLoading }))
    }
    if (
      this.state.visibility !== prevState.visibility &&
      this.state.visibility
    ) {
      this.groupsList.scrollTop = this.state.scrollPosition
    }
  }

  joinGroup() {
    const parsedUrl = new URL(window.location.href)
    const joinGroupCode = parsedUrl.searchParams.get('joinGroup')
    if (joinGroupCode) {
      //remove code from url
      window.history.replaceState({}, document.title, '/')
      var referenceLinkId = joinGroupCode
      var query = `mutation JoinGroup($referenceLinkId: ID!) {
    joinGroup(referenceLinkId: $referenceLinkId){id, name}
  }`

      API.graphql({
        query: query,
        variables: { referenceLinkId: referenceLinkId }
      })
        .then(response => {
          console.log(response)
          var found = this.state.groups.items.find(element => {
            return element.id === response.data.joinGroup.id
          })
          found &&
            this.setState(prevState => ({
              groups: {
                items: [response.data.joinGroup, ...prevState.groups.items],
                nextToken: prevState.nextToken
              }
            }))
        })
        .catch(error => {
          console.log(error)
        })
    }
  }

  updateDimensions() {
    this.setState({
      window: {
        height: window.innerHeight,
        width: window.innerWidth
      }
    })
  }

  listGroups() {
    this.setState(prevState => ({ toggleLoading: !prevState.toggleLoading }))
    var nextToken = this.state.groups.nextToken
    var query = `query ListGroups($nextToken: String) {
      listGroups(nextToken: $nextToken){items{id, name}, nextToken}
    }`

    API.graphql({
      query: query,
      variables: { nextToken: nextToken }
    })
      .then(response => {
        response.data.listGroups.items.length &&
          this.setState(prevState => ({
            groups: {
              items: prevState.groups.items.concat(
                response.data.listGroups.items
              ),
              nextToken: response.nextToken
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

  updateGroups(group) {
    this.setState(prevState => ({
      groups: {
        items: [group, ...prevState.groups.items],
        nextToken: prevState.nextToken
      }
    }))
  }

  initUser() {
    var query = `query GetUser {
  getUser{displayName}
}`

    API.graphql({
      query: query
    })
      .then(response => {
        console.log(response)
      })
      .catch(error => {
        console.log(error)
        localStorage.clear()
        this.props.history.push('/signin')
      })
      .finally(() => {})
  }
}

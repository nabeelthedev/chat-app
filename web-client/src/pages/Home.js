import React, { Component } from 'react'
import NavBar from '../components/NavBar'
import CreateGroup from '../components/CreateGroup'
import Messages from '../components/Messages'

class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {
      toggleLoading: false,
      groups: { items: [], nextToken: null }
    }
    this.listGroups = this.listGroups.bind(this)
    this.updateGroups = this.updateGroups.bind(this)
  }
  render() {
    return (
      <div>
        <NavBar id="nav-home">
          <CreateGroup updateGroups={this.updateGroups} />
        </NavBar>

        <div className="container-fluid p-0">
          {this.state.groups.items.length !== 0 ? (
            this.state.groups.items
              .sort((a, b) => (a.LastUpdated < b.LastUpdated ? 1 : -1))
              .map(x => (
                <div>
                  <Messages id={x.id} name={x.name} />
                </div>
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
      </div>
    )
  }

  componentDidMount() {
    this.setState(prevState => ({ toggleLoading: !prevState.toggleLoading }))
    this.listGroups()
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
  }

  listGroups() {
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
            var parsedResponse = JSON.parse(this.responseText).data.listGroups
            self.setState(prevState => ({
              groups: {
                items: prevState.groups.items.concat(parsedResponse.items),
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
    this.state.groups.nextToken
      ? (query =
          'query{listGroups(nextToken:"' +
          this.state.groups.nextToken +
          '"){items{id, name}, nextToken}}')
      : (query = 'query{listGroups{items{id, name, LastUpdated}, nextToken}}')
    xhr.send(
      JSON.stringify({
        query: query
      })
    )
  }

  updateGroups(groups) {
    this.setState(prevState => ({
      groups: {
        items: prevState.groups.items.concat(groups),
        nextToken: prevState.nextToken
      }
    }))
  }
}

export default Home

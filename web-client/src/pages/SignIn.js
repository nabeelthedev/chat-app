import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { httpReq, isAuthenticated } from '../utils'

export default class SignIn extends Component {
  constructor(props) {
    super(props)
    this.state = { redirectToReferrer: false, loading: false }
    this.authenticate = this.authenticate.bind(this)
  }

  render() {
    let { from } = this.props.location.state || { from: { pathname: '/' } }
    from.pathname !== '/'
      ? sessionStorage.setItem('from', JSON.stringify(from))
      : false
    let storedFrom = JSON.parse(sessionStorage.getItem('from'))
    storedFrom ? (from = storedFrom) : false
    let { redirectToReferrer } = this.state

    if (redirectToReferrer) return <Redirect to={from} />
    if (isAuthenticated()) return <Redirect to={{ pathname: '/' }} />

    return (
      <div className=".container-fluid">
        <div className="mx-auto w-50 fixed-bottom mb-5">
          <button
            className="btn btn-primary btn-block"
            disabled={this.state.loading ? true : false}
            onClick={() => {
              window.location.replace(
                'https://auth-dev.dnqr.xyz/oauth2/authorize?response_type=code&client_id=3oetmnc1c4io74v7s3dascvtg3&redirect_uri=https://dev.dnqr.xyz/signin'
              )
            }}
          >
            {this.state.loading ? 'Loading' : 'Sign In with Google'}
          </button>
        </div>
      </div>
    )
  }

  componentDidMount() {
    const parsedUrl = new URL(window.location.href)
    const code = parsedUrl.searchParams.get('code')
    if (code) {
      //remove code from url
      window.history.replaceState({}, document.title, '/signin')
      this.authenticate({
        code: code
      })
    }
  }
  authenticate(input) {
    this.setState({ loading: true })
    httpReq(
      {
        method: 'POST',
        body: JSON.stringify({
          Code: input.code,
          ClientId: '3oetmnc1c4io74v7s3dascvtg3',
          RedirectUri: 'https://dev.dnqr.xyz/signin'
        }),
        url: 'https://api.dnqr.xyz/session'
      },
      xhr => {
        if (xhr.status === 200) {
          var parsedResponse = JSON.parse(xhr.responseText)
          localStorage.setItem('sessionId', parsedResponse.sessionId)
          this.setState({ redirectToReferrer: true, loading: false })
        }
      }
    )
  }
}

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  withRouter,
  Switch
} from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.js'
import Home from './pages/Home'
import Groups from './pages/Groups'
import SignIn from './pages/SignIn'
import NavBar from './components/NavBar'
import { isAuthenticated } from './utils'

class Main extends Component {
  render() {
    return (
      <Router>
        {/* <AuthButton /> */}
        <Switch>
          <PrivateRoute exact path="/" component={Groups} />
          <Route path="/signin" component={SignIn} />
          <Redirect to={{ pathname: '/' }} />
        </Switch>
      </Router>
    )
  }
}

const AuthButton = withRouter(({ history }) =>
  isAuthenticated() ? (
    <NavBar history={history} />
  ) : (
    <div className=".container-fluid">
      <h3 className="w-50 mx-auto text-center mt-5">Sign In</h3>
    </div>
  )
)

const PrivateRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/signin',
              state: { from: props.location }
            }}
          />
        )
      }
    />
  )
}

ReactDOM.render(<Main />, document.getElementById('root'))

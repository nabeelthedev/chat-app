import React, { Component } from 'react'
import GetReferenceLink from './GetReferenceLink'

class NavBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ariaExpanded: false,
      toggleNavbar: () => {
        $('.collapse').collapse('hide')
        this.setState(prevState => ({ ariaExpanded: !prevState.ariaExpanded }))
      }
    }
  }
  componentDidMount() {
    // prevent clicking on navbar area to collapse itself
    document.addEventListener('click', e => {
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
    })
    this.addPropsToChildren()
    document.body.style.paddingTop = '60px'
  }
  addPropsToChildren() {
    var childWithProp = React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        toggleNavbar: this.state.toggleNavbar
      })
    })
    this.setState({ childWithProp: childWithProp })
  }
  render() {
    return (
      <nav className="navbar bg-dark navbar-dark fixed-top" id={this.props.id}>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#collapsibleNavbar"
          aria-expanded="false"
          aria-controls="collapsibleNavbar"
          id="navbar-toggler"
          onClick={() => {
            this.setState(prevState => ({
              ariaExpanded: !prevState.ariaExpanded
            }))
          }}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="navbar-collapse collapse" id="collapsibleNavbar">
          <ul className="navbar-nav p-4">
            <li className="nav-item mt-4">
              <GetReferenceLink />
            </li>
            <li className="nav-item mt-4">
              <a className="nav-link btn btn-primary w-75" href="#">
                Add Friend
              </a>
            </li>
            <li className="nav-item mt-4">
              <a
                className="nav-link btn btn-secondary w-75"
                href="#"
                onClick={() => {
                  localStorage.clear()
                  this.props.history.push('/signin')
                }}
              >
                Sign Out
              </a>
            </li>
            {this.state.childWithProp &&
            typeof this.state.childWithProp.length === 'undefined' ? (
              <li className="nav-item mt-4">{this.state.childWithProp}</li>
            ) : (
              false
            )}
            {this.state.childWithProp &&
            typeof this.state.childWithProp.length !== 'undefined'
              ? this.state.childWithProp.map(x => (
                  <li className="nav-item mt-4">{x}</li>
                ))
              : false}
          </ul>
        </div>
      </nav>
    )
  }
}

export default NavBar

import React, { Component } from 'react'
import Linkify from 'linkifyjs/react'

export default class Message extends Component {
  constructor(props) {
    super(props)
  }
  componentDidMount() {}
  componentDidUpdate(prevProps, prevState) {}

  render() {
    return (
      <div className="card">
        <div className="card-body" style={{ whiteSpace: 'pre-wrap' }}>
          <p className="card-text">
            <Linkify>{this.props.message.message}</Linkify>
          </p>
          <p className="card-text">
            <small className="text-muted">
              {this.props.message.DisplayName + ' - '}
              {new Date(
                this.props.message.CreateTime * 1000
              ).toLocaleTimeString()}
              {' - '}
              {new Date(
                this.props.message.CreateTime * 1000
              ).toLocaleDateString()}
            </small>
          </p>
        </div>
      </div>
    )
  }
}

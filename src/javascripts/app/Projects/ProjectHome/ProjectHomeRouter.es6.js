import React from 'react';
import PropTypes from 'prop-types';

import ProjectHome from './ProjectHome.es6';

export default class ProjectHomeRouter extends React.Component {
  static propTypes = {
    onReady: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    return <ProjectHome />;
  }
}

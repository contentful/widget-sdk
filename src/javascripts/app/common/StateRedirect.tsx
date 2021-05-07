import React from 'react';
import * as Navigator from 'states/Navigator';
import type { StateLinkProps } from './StateLink';

export type StateRedirectProps = Pick<StateLinkProps, 'path' | 'params' | 'options'>;

export class StateRedirect extends React.Component<StateRedirectProps> {
  componentDidMount() {
    // This allows to avoid interference with React Router
    setImmediate(() =>
      Navigator.go({
        path: this.props.path,
        params: this.props.params,
        options: this.props.options,
      })
    );
  }

  render() {
    return null;
  }
}

export default StateRedirect;

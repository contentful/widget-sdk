import React from 'react';
import PropTypes from 'prop-types';
import { range } from 'lodash';
import { Table, TableBody, TableHead, TableRow, TableCell } from '@contentful/ui-component-library';
import StateLink from 'app/common/StateLink.es6';
import WebhookCallStatus from './WebhookCallStatus.es6';

const PER_PAGE = 30;

class WebhookActivityLog extends React.Component {
  static propTypes = {
    webhookId: PropTypes.string,
    webhookRepo: PropTypes.object.isRequired,
    registerLogRefreshAction: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { page: 0, loading: false, calls: [] };
  }

  componentDidMount() {
    this.fetch();
    this.props.registerLogRefreshAction(this.fetch.bind(this));
  }

  fetch() {
    const { webhookId, webhookRepo } = this.props;

    if (typeof webhookId !== 'string' || this.state.loading) {
      return Promise.resolve();
    }

    this.setState({ loading: true });

    return new Promise(resolve => {
      webhookRepo.logs
        .getCalls(webhookId)
        .then(
          calls => this.setState({ page: 0, loading: false, calls }, () => resolve()),
          () => this.setState({ page: 0, loading: false, calls: [] }, () => resolve())
        );
    });
  }

  render() {
    const { page, loading, calls } = this.state;

    const pageCalls = calls.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
    const pages = range(0, Math.ceil(calls.length / PER_PAGE));

    return (
      <React.Fragment>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '35%' }}>Webhook called at</TableCell>
              <TableCell style={{ width: '20%' }}>Call result</TableCell>
              <TableCell style={{ width: '45%' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan="3">Loading logs…</TableCell>
              </TableRow>
            )}
            {!loading &&
              pageCalls.length < 1 && (
                <TableRow>
                  <TableCell colSpan="3">No webhook calls yet!</TableCell>
                </TableRow>
              )}
            {!loading &&
              pageCalls.length > 0 &&
              pageCalls.map(call => {
                return (
                  <StateLink
                    to="^.detail.call"
                    params={{
                      callId: call.sys.id
                    }}
                    key={call.sys.id}>
                    {({ onClick }) => (
                      <TableRow style={{ cursor: 'pointer' }} onClick={onClick}>
                        <TableCell>{call.requestAt}</TableCell>
                        <TableCell>
                          <WebhookCallStatus call={call} />
                        </TableCell>
                        <TableCell>
                          <button className="text-link">View details</button>
                        </TableCell>
                      </TableRow>
                    )}
                  </StateLink>
                );
              })}
          </TableBody>
        </Table>
        {!loading && pages.length > 1 && this.renderPaginator(page, pages)}
      </React.Fragment>
    );
  }

  renderPaginator(page, pages) {
    return (
      <div className="webhook-calls__paginator">
        {page > 0 && (
          <a
            href=""
            className="webhook-calls__paginator-item"
            onClick={() => this.setState(s => ({ page: s.page - 1 }))}>
            «
          </a>
        )}

        {pages.map(cur => (
          <a
            key={cur}
            href=""
            className={`webhook-calls__paginator-item${page === cur ? ' x--active' : ''}`}
            onClick={() => this.setState({ page: cur })}>
            {cur + 1}
          </a>
        ))}

        {page < pages.length - 1 && (
          <a
            href=""
            className="webhook-calls__paginator-item"
            onClick={() => this.setState(s => ({ page: s.page + 1 }))}>
            »
          </a>
        )}
      </div>
    );
  }
}

export default WebhookActivityLog;

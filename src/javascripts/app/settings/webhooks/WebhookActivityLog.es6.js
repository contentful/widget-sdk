import React from 'react';
import PropTypes from 'prop-types';
import { range } from 'lodash';
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
        <div className="table">
          <div className="table__head">
            <table>
              <thead>
                <tr>
                  <th>Webhook called at</th>
                  <th className="x--large-cell">Call result</th>
                  <th>Actions</th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="table__body">
            <table>
              <tbody>
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
                          <tr className="x--clickable" onClick={onClick}>
                            <td>{call.requestAt}</td>
                            <td className="x--large-cell">
                              <WebhookCallStatus call={call} />
                            </td>
                            <td>
                              <button className="text-link">View details</button>
                            </td>
                          </tr>
                        )}
                      </StateLink>
                    );
                  })}
                {!loading &&
                  pageCalls.length < 1 && (
                    <tr>
                      <td colSpan="3">No webhook calls yet!</td>
                    </tr>
                  )}
                {loading && (
                  <tr>
                    <td colSpan="3">Loading logs…</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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

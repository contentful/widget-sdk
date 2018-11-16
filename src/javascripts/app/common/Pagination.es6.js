import React from 'react';
import PropTypes from 'prop-types';

import { Select, Option, Button } from '@contentful/ui-component-library';

export default class Pagination extends React.Component {
  static propTypes = {
    skip: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    loading: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  };

  static getDerivedStateFromProps(nextProps) {
    const { skip, limit, total } = nextProps;
    return {
      isLastPage: skip + limit >= total,
      isFirstPage: skip === 0
    };
  }

  state = {
    isFirstPage: true,
    isLastPage: true
  };

  handleLimitChange = ({ target: { value } }) => {
    const { skip } = this.props;
    this.props.onChange({ skip, limit: parseInt(value) });
  };

  handlePreviousClick = () => {
    const { limit, skip } = this.props;
    this.props.onChange({ skip: Math.max(skip - limit, 0), limit });
  };

  handleNextClick = () => {
    const { limit, skip } = this.props;
    this.props.onChange({ skip: skip + limit, limit });
  };

  render() {
    const { skip, limit, total, loading } = this.props;
    const { isFirstPage, isLastPage } = this.state;

    return (
      <div className="pagination">
        <nav className="pagination__nav">
          <p className="pagination__text">View</p>
          <Select
            value={`${limit}`} // TODO: this component should not require string as a value
            onChange={this.handleLimitChange}
            width="small"
            extraClassNames="pagination__limit-selector">
            <Option value="10">10</Option>
            <Option value="25">25</Option>
            <Option value="50">50</Option>
            <Option value="100">100</Option>
          </Select>
        </nav>

        <nav className="pagination__nav">
          <p className="pagination__text">
            Showing {`${Math.min(skip + 1, total)} - ${Math.min(skip + limit, total)}`} of {total}
          </p>{' '}
          <Button
            disabled={isFirstPage || loading}
            onClick={this.handlePreviousClick}
            buttonType="muted"
            extraClassNames="pagination__button">
            Previous
          </Button>{' '}
          <Button
            disabled={isLastPage || loading}
            onClick={this.handleNextClick}
            buttonType="muted"
            extraClassNames="pagination__button">
            Next
          </Button>
        </nav>
      </div>
    );
  }
}

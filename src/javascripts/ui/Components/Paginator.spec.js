import React from 'react';
import Enzyme from 'enzyme';
import Paginator from './Paginator';

describe('ui/Components/Paginator', () => {
  const shallow = ({ page, pageCount }) => {
    const onSelectStub = jest.fn();
    const wrapper = Enzyme.shallow(
      <Paginator select={onSelectStub} page={page} pageCount={pageCount} />
    );
    return { wrapper, onSelectStub };
  };

  it('selects previous page', function() {
    const { wrapper, onSelectStub } = shallow({
      page: 3,
      pageCount: 5
    });

    wrapper.find({ 'data-test-id': 'paginator.prev' }).simulate('click');
    expect(onSelectStub).toHaveBeenCalledWith(2);
  });

  it('selects next page', function() {
    const { wrapper, onSelectStub } = shallow({
      page: 3,
      pageCount: 5
    });

    wrapper.find({ 'data-test-id': 'paginator.next' }).simulate('click');
    expect(onSelectStub).toHaveBeenCalledWith(4);
  });

  it('selects first page', function() {
    const { wrapper, onSelectStub } = shallow({
      page: 50,
      pageCount: 100
    });
    wrapper.find({ 'data-test-id': 'paginator.select.0' }).simulate('click');
    expect(onSelectStub).toHaveBeenCalledWith(0);
  });

  it('selects last page', function() {
    const { wrapper, onSelectStub } = shallow({
      page: 50,
      pageCount: 100
    });
    wrapper.find({ 'data-test-id': 'paginator.select.99' }).simulate('click');
    expect(onSelectStub).toHaveBeenCalledWith(99);
  });

  it('selects current page page', function() {
    const { wrapper } = shallow({
      page: 50,
      pageCount: 100
    });
    expect(wrapper.find({ 'data-test-id': 'paginator.select.50' })).toHaveProp(
      'aria-selected',
      'true'
    );
  });

  it('is not shown if there is only one page', function() {
    const test1 = shallow({
      page: 50,
      pageCount: 100
    });
    expect(test1.wrapper.find({ 'data-test-id': 'paginator' })).toExist();
    const test2 = shallow({
      page: 0,
      pageCount: 1
    });
    expect(test2.wrapper.find({ 'data-test-id': 'paginator' })).not.toExist();
  });

  it('shows neighboring pages', function() {
    function assertPageLabels(wrapper, labels) {
      expect(wrapper.find({ 'data-test-id': 'paginator.pages' })).toHaveText(labels.join(''));
    }

    assertPageLabels(
      shallow({
        page: 1,
        pageCount: 100
      }).wrapper,
      [1, 2, 3, 4, 5, 6, '…', 100]
    );

    assertPageLabels(
      shallow({
        page: 99,
        pageCount: 100
      }).wrapper,
      [1, '…', 95, 96, 97, 98, 99, 100]
    );

    assertPageLabels(
      shallow({
        page: 49,
        pageCount: 100
      }).wrapper,
      [1, '…', 48, 49, 50, 51, 52, '…', 100]
    );
  });
});

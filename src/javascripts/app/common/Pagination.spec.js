import React from 'react';

import { render, fireEvent } from '@testing-library/react';

import Pagination from './Pagination';

describe('Pagination', () => {
  const onChangeFn = jest.fn();

  const mount = (skip, limit, total, loading) => {
    return render(
      <Pagination skip={skip} limit={limit} total={total} loading={loading} onChange={onChangeFn} />
    );
  };

  it('disables the Previous button if it is the first page', () => {
    const { getByTestId } = mount(0, 10, 100, false);
    const previous = getByTestId('pagination.previous');
    expect(previous).toBeDisabled();
  });

  it('enables the Previous and Next buttons if it is not the first page or last pages', () => {
    const { getByTestId } = mount(10, 10, 100, false);
    const previous = getByTestId('pagination.previous');
    const next = getByTestId('pagination.next');
    expect(previous).not.toBeDisabled();
    expect(next).not.toBeDisabled();
  });

  it('disables the Next button if it is the last page', () => {
    const { getByTestId } = mount(90, 10, 100, false);
    const next = getByTestId('pagination.next');
    expect(next).toBeDisabled();
  });

  it('disables the Next and Previous buttons there is only one avialable page', () => {
    const { getByTestId } = mount(0, 10, 10, false);
    const previous = getByTestId('pagination.previous');
    const next = getByTestId('pagination.next');
    expect(previous).toBeDisabled();
    expect(next).toBeDisabled();
  });

  it('disables the Next and Previous buttons there is loading', () => {
    const { getByTestId } = mount(20, 10, 100, true);
    const previous = getByTestId('pagination.previous');
    const next = getByTestId('pagination.next');
    expect(previous).toBeDisabled();
    expect(next).toBeDisabled();
  });

  it('triggers onChange on the Next button click', () => {
    const currentSkip = 10;
    const limit = 10;
    const desiredSkip = currentSkip + limit;
    const { getByTestId } = mount(currentSkip, limit, 100, false);
    const next = getByTestId('pagination.next');
    fireEvent.click(next);
    expect(onChangeFn).toHaveBeenCalledWith({ skip: desiredSkip, limit });
  });

  it('triggers onChange on the Previous button click', () => {
    const currentSkip = 10;
    const limit = 10;
    const desiredSkip = currentSkip - limit;
    const { getByTestId } = mount(currentSkip, limit, 100, false);
    const previous = getByTestId('pagination.previous');
    fireEvent.click(previous);
    expect(onChangeFn).toHaveBeenCalledWith({ skip: desiredSkip, limit });
  });

  it('trigger onChange on the limit selector change', () => {
    const { getByTestId } = mount(10, 10, 100, false);
    const limitSelector = getByTestId('pagination.limit');
    fireEvent.change(limitSelector, { target: { value: 25 } });
    expect(onChangeFn).toHaveBeenCalledWith({ skip: 10, limit: 25 });
  });
});

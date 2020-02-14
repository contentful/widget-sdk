import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import DeleteAppDialog from './DeleteAppDialog';

describe('DeleteAppDialog', () => {
  it('should allow deletion only with exact name', () => {
    const appName = 'App Name';
    let deleted = false;
    const onConfirmHandler = () => {
      deleted = true;
      return Promise.resolve(null);
    };

    const { baseElement } = render(
      <DeleteAppDialog isShown onConfirm={onConfirmHandler} onCancel={() => {}} appName={appName} />
    );
    const input = baseElement.querySelector('input[type=text]');
    const deleteButton = baseElement.querySelector('button');

    expect(deleteButton.disabled).toBe(true);

    input.value = appName.toLowerCase();
    fireEvent.input(input);
    fireEvent.click(deleteButton);

    expect(deleted).toBe(false);
    expect(deleteButton.disabled).toBe(true);

    input.value = appName;
    fireEvent.input(input);
    fireEvent.click(deleteButton);

    expect(deleted).toBe(true);
  });
});

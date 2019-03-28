import React from 'react';
import Advice from 'components/tabs/Advice/index.es6';
import EmptyContentIcon from 'svg/empty-content-model.es6';

export default function NoLocalizedFieldsAdvice() {
  return (
    <Advice data-test-id="no-content-type-advice">
      <Advice.Icon>
        <EmptyContentIcon />
      </Advice.Icon>
      <Advice.Title>There are no localized fields for this locale</Advice.Title>
      <Advice.Description>
        The locale you have chosen does no have any localized fields to display. You can see which
        fields are editable by switching to a new locale, or by toggling into the multiple locale
        display.
      </Advice.Description>
    </Advice>
  );
}

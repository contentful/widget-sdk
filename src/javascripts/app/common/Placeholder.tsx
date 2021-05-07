import React from 'react';
import { Spinner } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const withLongWordsHandled = css({
  overflowX: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '40rem',
  lineHeight: '1.6rem',
});

type Props = {
  title: string;
  text: string;
  button?: React.ReactNode;
  testId?: string;
  loading?: boolean;
};

export default function Placeholder({ loading = false, title, text, button, testId }: Props) {
  return (
    <div className="empty-placeholder" data-test-id={testId}>
      {loading ? <Spinner size="large" className="empty-placeholder__spinner" /> : null}
      <h2 className={withLongWordsHandled} title={title}>
        {title}
      </h2>
      <div className={withLongWordsHandled} title={text}>
        {text}
      </div>
      {button && button}
    </div>
  );
}

import { renderHook } from '@testing-library/react-hooks';

import { usePageContent } from './usePageContent';

const initial = {
  pageName: 'Space Purchase',
  content: [
    {
      sys: {
        contentType: {
          sys: {
            id: 'webappFaqEntry',
          },
        },
      },
      fields: { question: 'What?', answer: {} },
    },
  ],
};

const initHook = (initialPageContent) => {
  return renderHook((pageContent = initialPageContent) => usePageContent(pageContent));
};

describe('usePageContent', () => {
  it('should initialize the content of the page', () => {
    const { result } = initHook(initial);
    const { faqEntries } = result.current;

    expect(faqEntries).toHaveLength(initial.content.length);
    expect(faqEntries[0]).toEqual(initial.content[0]);
  });
});

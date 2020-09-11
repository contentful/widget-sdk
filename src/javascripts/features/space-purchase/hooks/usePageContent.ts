import { useState, useEffect } from 'react';
import { PageContent, FaqEntry } from '../services/fetchSpacePurchaseContent';

function usePageContent(pageContent: PageContent) {
  const [faqEntries, setFAQEntries] = useState<FaqEntry[]>([]);

  useEffect(() => {
    // filter only the FAQ entries
    if (pageContent.content.length > 0) {
      const questions = pageContent.content.filter(
        (entry) => entry.sys.contentType.sys.id === 'webappFaqEntry'
      );
      setFAQEntries(questions as FaqEntry[]);
    }
  }, [pageContent.content]);

  return { faqEntries };
}

export { usePageContent };

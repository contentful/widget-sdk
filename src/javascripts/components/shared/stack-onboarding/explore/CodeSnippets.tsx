import React, { useEffect, useState } from 'react';
import Code from 'components/shared/stack-onboarding/components/Code';
import { getDeliveryToken } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import IframeHighlightHOC from 'components/shared/stack-onboarding/explore/IframeHighlightHOC';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';

type CodeSnippetProps = {
  title: string;
  code: string[];
  subtitle?: string;
  onHover?: () => void;
  onLeave?: () => void;
  active?: boolean;
};

const CodeSnippet = ({ title, subtitle, code, onHover, onLeave, active }: CodeSnippetProps) => (
  <div>
    <h4 className={'modern-stack-onboarding--code-title'}>{title}</h4>
    {subtitle && <div className={'modern-stack-onboarding--code-subtitle'}>{subtitle}</div>}
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={'modern-stack-onboarding--code-wrapper'}>
      <Code lineNumbers={false} code={code} className={'modern-stack-onboarding--code-block'} />
      {active && <div className={'modern-stack-onboarding--active-data'} />}
    </div>
  </div>
);

const CodeSnippets = ({
  active,
  onHover,
  onLeave,
}: {
  active: string;
  onHover: (type: string) => void;
  onLeave: () => void;
}) => {
  const [deliveryToken, setDeliveryToken] = useState();
  const { currentSpaceId } = useSpaceEnvContext();

  useEffect(() => {
    const fetchDeliveryToken = async () => {
      setDeliveryToken(await getDeliveryToken());
    };
    fetchDeliveryToken();
  }, []);

  const bootstrapSnippet = {
    title: 'Bootstrap the Contentful JS SDK',
    code: [
      "import contentful from 'contentful'",
      '',
      'const client = contentful.createClient({',
      `  space: '${currentSpaceId || 'loading...'}',`,
      `  accessToken: '${deliveryToken || 'loading...'}'`,
      '})',
    ],
  };

  const peopleSnippet = {
    title: 'Fetch all people',
    subtitle: 'We filter and fetch the data (entries) in your space by the “person” content type.',
    code: [
      'async function getPeople() {',
      "  const entries = await client.getEntries({ content_type: 'person' })",
      '  return entries.items',
      '}',
    ],
    onHover: () => onHover('person'),
    onLeave,
    active: active === 'person',
  };

  const postsSnippet = {
    title: 'Fetch all blog posts',
    subtitle:
      'We filter and fetch the data (entries) in your space by the “blogPost” content type.',
    code: [
      'async function getBlogPosts() {',
      "  const entries = await client.getEntries({ content_type: 'blogPost' })",
      '  return entries.items',
      '}',
    ],
    onHover: () => onHover('articles'),
    onLeave,
    active: active === 'articles',
  };

  const allSnippet = {
    title: 'Put it all together',
    subtitle: 'We use the data from your Contentful space to render the interface.',
    code: [
      'const App = ({ author, blogPosts }) => (',
      '  <div>',
      '    <Hero person={author} />',
      '    <div>',
      '      <h2>Recent articles</h2>',
      '      <ul className="article-list">',
      '        {blogPosts.map(post => <ArticlePreview article={post} />)}',
      '      </ul>',
      '    </div>',
      '  </div>',
      ')',
      '',
      'async function renderApp() {',
      '  const [author] = await getPeople()',
      '  const blogPosts = await getBlogPosts()',
      '',
      '  ReactDOM.render(',
      '    <App author={author} blogPosts={blogPosts} />,',
      "    document.getElementById('root')",
      '  )',
      '}',
      '',
      'renderApp()',
    ],
    onHover: () => onHover('all'),
    onLeave,
    active: active === 'all',
  };

  return (
    <div>
      <CodeSnippet {...bootstrapSnippet} />
      <CodeSnippet {...peopleSnippet} />
      <CodeSnippet {...postsSnippet} />
      <CodeSnippet {...allSnippet} />
    </div>
  );
};

export default IframeHighlightHOC(CodeSnippets);

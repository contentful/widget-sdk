import React from 'react';
import Enzyme from 'enzyme';
import createFetcherComponent, { FetcherLoading } from './createFetcherComponent';

describe('createFetcherComponent', () => {
  it('should create fetcher component and renders LoadingComponent', () => {
    const promiseStub = jest.fn().mockResolvedValue({});

    const Component = createFetcherComponent(({ param1, param2 }) => {
      return promiseStub(param1, param2);
    });

    let wrapper = Enzyme.mount(
      <Component param1="1" param2="2">
        {({ isLoading }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading test component..." />;
          }
          return null;
        }}
      </Component>
    );

    expect(promiseStub).toHaveBeenCalledWith('1', '2');
    expect(wrapper.childAt(0)).toMatchInlineSnapshot(`
<FetcherLoading
  message="Loading test component..."
>
  <Delayed
    delay={300}
  />
</FetcherLoading>
`);
  });
});

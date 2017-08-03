xdescribe('docs_sidebar/InputWithCopy', function () {
  beforeEach(function () {
    module('contentful/test');

    this.userAgent = this.$inject('userAgent');
    this.userAgent.isSafari = sinon.stub().returns(false);

    this.DOMRenderer = this.$inject('ui/Framework/DOMRenderer').default;
    this.InputWithCopy = this.$inject('components/docs_sidebar/InputWithCopy').default;

    this.compile = function () {
      this.render = sinon.stub();
      const component = document.createElement('div');
      const vtree = this.InputWithCopy('input-1', 'yolo', this.render);
      this.DOMRenderer(component).render(vtree);
      this.$component = $(component);
    };
  });

  it('renders input text', function () {
    this.compile();
    const $input = this.$component.find('input');
    expect($input.val()).toBe('yolo');
    expect($input.attr('aria-label')).toBe('input-1');
  });

  it('shows copy button', function () {
    this.compile();
    const $button = this.$component.find('button');
    expect($button.length).toBe(1);
  });

  it('hides copy button in Safari', function () {
    this.userAgent.isSafari.returns(true);
    this.compile();
    const $button = this.$component.find('button');
    expect($button.length).toBe(0);
  });
});

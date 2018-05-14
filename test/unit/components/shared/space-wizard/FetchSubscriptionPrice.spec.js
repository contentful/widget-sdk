import React from 'react';
import { mount } from 'enzyme';

describe('FetchSubscriptionPrice', function () {
  beforeEach(function () {
    this.stubs = {
      getSubscriptionPlans: sinon.stub().resolves([]),
      calculateTotalPrice: sinon.stub().returns(0)
    };

    module('contentful/test', ($provide) => {
      $provide.value('account/pricing/PricingDataProvider', {
        getSubscriptionPlans: this.stubs.getSubscriptionPlans,
        calculateTotalPrice: this.stubs.calculateTotalPrice
      });
    });

    this.FetchSubscriptionPrice = this.$inject('components/shared/space-wizard/FetchSubscriptionPrice').default;
    this.renderChild = sinon.stub().returns(null);

    this.mount = () => {
      this.component = mount(
        <this.FetchSubscriptionPrice
          organizationId='1234'
        >
          {this.renderChild}
        </this.FetchSubscriptionPrice>
      );
    };

    this.mount();
  });

  it('should request the subscription plans', function () {
    expect(this.stubs.getSubscriptionPlans.called).toBe(true);
  });

  it('should initially call the render child with a pending request state', function () {
    expect(this.renderChild.calledWith({
      requestState: 'pending',
      error: null,
      totalPrice: 0
    })).toBe(true);
  });

  it('should call the render child with data and a successful request state on success', async function () {
    await this.stubs.getSubscriptionPlans();

    expect(this.renderChild.calledWith({
      requestState: 'success',
      error: null,
      totalPrice: 0
    })).toBe(true);
  });

  it('should call the render child with an errorful request state on error', async function () {
    const error = new Error('Could not get space rate plans');

    this.stubs.getSubscriptionPlans.rejects(error);

    // Remount with new stub
    this.mount();

    try {
      await this.stubs.getSubscriptionPlans();
    } catch (e) {
      // Ignore error
    }

    expect(this.renderChild.calledWith({
      error: error,
      totalPrice: 0,
      requestState: 'error'
    })).toBe(true);
  });

  it('should defer to calculateTotalPrice from PricingDataProvider for price calculation', async function () {
    this.stubs.calculateTotalPrice.returns(150);
    this.mount();
    await this.stubs.getSubscriptionPlans();

    expect(this.renderChild.calledWith({
      requestState: 'success',
      error: null,
      totalPrice: 150
    })).toBe(true);

    this.stubs.calculateTotalPrice.returns(300);
    this.mount();
    await this.stubs.getSubscriptionPlans();

    expect(this.renderChild.calledWith({
      requestState: 'success',
      error: null,
      totalPrice: 300
    })).toBe(true);
  });
});

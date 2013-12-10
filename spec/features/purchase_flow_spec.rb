require 'spec_helper'

feature 'Purchase flow', js: true, sauce: true do
  before do
    ensure_login
    visit "#{app_host}/profile/subscription"
  end

  scenario 'Change Subscription plan', non_ci: true do # no way to reset form on staging
    tab_iframe do
      first('a', text: 'Choose plan').click
      #first('.billing .table-edit-button').click
      click_link 'Continue'
      click_button 'Purchase'
      page.should have_text('Your plan was successfully updated!')
    end
  end

  scenario 'Change Billing information', non_ci: true do # no way to reset form on staging
    tab_iframe do
      first('a', text: 'Choose plan').click
      first('.table-edit-button a').click
      fill_in 'billing_address_name', with: 'Foo McBar'
      click_button 'Update Billing Address'
      page.should have_text('Foo McBar')
    end
  end

  scenario 'Change Credit Card information', non_ci: true do # no way to reset form on staging
    tab_iframe do
      first('a', text: 'Choose plan').click
      all('.table-edit-button a')[1].click
      find('.cc-number input').set('4')
      all('.cc-number input')[0].set('4200')
      all('.cc-number input')[1].set('0000')
      all('.cc-number input')[2].set('0000')
      all('.cc-number input')[3].set('0000')
      find('.cc-exp-field-m').set('1')
      find('.cc-exp-field-y').set('16')
      find('.cc-name').set('Foo Bar')
      find('.flip-tab').click
      find('.cc-cvc').set('123')
      click_button 'Save Credit Card'
      page.should have_text('Foo Bar')
    end
  end

  scenario 'Toggle Plan details' do
    tab_iframe do
      first('.details-show').click
      page.should have_text('Core platform')
      page.should have_text('SSL')
      find('.details-hide').click
      page.should_not have_text('Core platform')
      page.should_not have_text('SSL')
    end
  end

  scenario 'Toggle period', non_ci: true do # no yearly plans on staging
    tab_iframe do
      find('.toggle-button.annually').click
      page.should have_text('/ year')
      page.should_not have_text('/ month')
      find('.toggle-button.monthly').click
      page.should_not have_text('/ year')
      page.should have_text('/ month')
    end
  end

  scenario 'Fill enterprise form' do
    tab_iframe do
      click_link 'Contact us'
      fill_in 'phone_number', with: '123456'
      fill_in 'description', with: "Hello Guys,\njust testing lol.\n\nTravis McTestbot"
      click_button 'Send message'
    end
    expect_success 'Thanks for getting in touch. We will get back to you shortly'
  end

  scenario 'Switch period in step 2', non_ci: true do # no yearly plans on staging
    tab_iframe do
      first('a', text: 'Choose plan').click
      click_link 'Switch to annual'
      page.should have_text('Annually')
      page.should have_text('/ year')
    end
    expect_success 'The new plan has been switched to the annual plan'
  end

  scenario 'Switch plan in step 2' do
    tab_iframe do
      first('a', text: 'Choose plan').click
      click_link 'Change'
    end
    current_url.should eql("#{app_host}/profile/subscription")
  end
end

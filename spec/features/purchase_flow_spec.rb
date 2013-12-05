require 'spec_helper'

feature 'Purchase flow', js: true, sauce: true, non_ci: true do
  before do
    ensure_login
    visit "#{app_host}/profile/subscription"
  end

  scenario 'Change Subscription plan' do
    tab_iframe do
      first('a', text: 'Choose plan').click
      #first('.billing .table-edit-button').click
      click_link 'Continue'
      click_button 'Purchase'
      page.should have_text('Your plan was successfully updated!')
    end
  end

  scenario 'Change Billing information' do
    tab_iframe do
      first('a', text: 'Choose plan').click
      first('.table-edit-button a').click
      fill_in 'billing_address_name', with: 'Foo McBar'
      click_button 'Update Billing Address'
      page.should have_text('Foo McBar')
    end
  end

  scenario 'Change Credit Card information' do
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
end

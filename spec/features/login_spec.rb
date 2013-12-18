require 'spec_helper'

feature 'Logging in', js: true, sauce: true do
  before do
    clear_access_token
    visit "#{be_host}/logout"
  end

  scenario 'The user should not be logged in' do
    visit "#{app_host}/"
    expect(current_url).to eq("#{be_host}/login")
  end

  scenario 'The user should be able to login' do
    ensure_login
  end
end

feature 'Registration', js: true, sauce: true do
  before do
    ensure_logout
  end

  after do
    visit "#{be_host}/profile/user_cancellation/new"
    click_button 'Cancel Account'
    expect(page).to have_text("We're sorry to see you go.")
  end

  scenario 'I want to be able to register' do
    visit "#{be_host}/register"
    fill_in 'user_first_name', with: 'Test'
    fill_in 'user_last_name', with: 'User'
    fill_in 'user_email', with: 'testuser@contentful.com'
    fill_in 'user_password', with: 'password'
    fill_in 'user_coupon_code', with: 'bootstrap' if first('#user_coupon_code')
    click_button 'Sign Up'
    expect(page).to have_selector('.client')
  end
end

feature "Account cancellation", js:true, sauce: true do
  before do
    ensure_logout
    visit "#{be_host}/register"
    fill_in 'user_first_name', with: 'Test'
    fill_in 'user_last_name', with: 'User'
    fill_in 'user_email', with: 'testuser@contentful.com'
    fill_in 'user_password', with: 'password'
    fill_in 'user_coupon_code', with: 'bootstrap' if first('#user_coupon_code')
    click_button 'Sign Up'
    find('.client')
  end

  scenario 'After deleting my account I want to see the goodbye page' do
    visit "#{app_host}/profile/user_cancellation/new"
    tab_iframe do
      click_button 'Cancel Account'
    end
    expect(current_url).to eql("#{marketing_host}/goodbye")
    #expect(page).to have_text('Please let us know about your experience')
  end
end

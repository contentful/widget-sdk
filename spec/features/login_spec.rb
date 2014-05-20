require 'spec_helper'

feature 'Logging in', js: true do
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

feature 'Registration', js: true, quirely_only: true do
  include GatekeeperHelper
  before do
    ensure_logout
    reset_system
  end

  after do
    visit "#{be_host}/account/profile/user_cancellation/new"
    click_button 'Cancel User Account'
    expect(page).to have_text("We're sorry to see you go.")
    clear_access_token
    reset_system
  end

  scenario 'I want to be able to register' do
    visit "#{be_host}/register"
    fill_in 'user_first_name', with: 'Test'
    fill_in 'user_last_name', with: 'User'
    fill_in 'user_organization_name', with: 'Test Organization'
    fill_in 'user_email', with: 'testuser@contentful.com'
    fill_in 'user_password', with: 'password'
    fill_in 'user_coupon_code', with: 'bootstrap' if first('#user_coupon_code')
    click_button 'Sign Up'
    expect(page).to have_selector('.client')
  end
end

feature "Account cancellation", js:true, quirely_only: true do
  include GatekeeperHelper
  before do
    ensure_logout
    reset_system
    visit "#{be_host}/register"
    fill_in 'user_first_name', with: 'Test'
    fill_in 'user_last_name', with: 'User'
    fill_in 'user_organization_name', with: 'Test Organization'
    fill_in 'user_email', with: 'testuser@contentful.com'
    fill_in 'user_password', with: 'password'
    fill_in 'user_coupon_code', with: 'bootstrap' if first('#user_coupon_code')
    click_button 'Sign Up'
    find('.client')
  end

  after do
    reset_system
    clear_access_token
  end

  scenario 'After deleting my account I want to see the goodbye page' do
    visit "#{app_host}/account/profile/user_cancellation/new"
    tab_iframe do
      click_button 'Cancel User Account'
    end
    expect(current_url).to eql("#{marketing_host}/goodbye")
    #expect(page).to have_text('Please let us know about your experience')
  end
end

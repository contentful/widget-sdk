require 'spec_helper'

feature 'Logging in', js: true, sauce: true do
  before do
    clear_access_token
    visit "#{be_host}/logout"
  end

  scenario 'The user should not be logged in' do
    visit "#{app_host}/"
    current_url.should eq("#{be_host}/login")
  end

  scenario 'The user should be able to login' do
    ensure_login
  end
end

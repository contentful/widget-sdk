require 'spec_helper'

feature 'Logging in', js: true do
  before do
    #clear_cookies
    visit 'http://be.joistio.com:8888/logout'
  end

  scenario 'The user should not be logged in' do
    visit '/'
    current_url.should eq('http://be.joistio.com:8888/login')
  end

  scenario 'The user should be able to login' do
    ensure_login
  end
end

module FeatureHelper
  def ensure_login
    visit '/'
    begin
      page.find('space-view')
    rescue Capybara::ElementNotFound
      fill_in 'user_email', with: 'user@example.com'
      fill_in 'user_password', with: 'password'
      click_button 'Sign In'
    end
    page.find('space-view')
  end

  def clear_cookies
    # https://makandracards.com/makandra/16117-how-to-clear-cookies-in-capybara-tests-both-selenium-and-rack-test
    browser = Capybara.current_session.driver.browser
    if browser.respond_to?(:clear_cookies)
      # Rack::MockSession
      browser.clear_cookies
    elsif browser.respond_to?(:manage) and browser.manage.respond_to?(:delete_all_cookies)
      # Selenium::WebDriver
      browser.manage.delete_all_cookies
    else
      raise "Don't know how to clear cookies. Weird driver?"
    end
  end

  def remove_test_space
    within 'nav.account .project' do
      find('.dropdown-toggle').click
      begin
        all('li').find{|li| li.text == 'TestSpace'}.click
      catch Capybara::ElementNotFound
        return
      end
    end

    within '.nav-bar' do
      all('li').last.click
    end

    within_frame 0 do
      all('a').find{|a| a[:'data-method'] == 'delete'}.click
      page.driver.browser.switch_to.alert.accept
    end
  end

  def create_test_space
    within 'nav.account .project' do
      find('.dropdown-toggle').click
      all('li').last.click
    end
    within 'form[name=newSpaceForm]' do
      fill_in 'name', with: 'TestSpace'
      fill_in 'locale', with: 'en-US'
      click_button 'Create Space'
    end
  end
end

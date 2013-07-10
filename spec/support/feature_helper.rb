module FeatureHelper
  @@access_token = nil

  def access_token
    @@access_token
  end

  def access_token=(t)
    @@access_token = t
  end

  def ensure_login
    if access_token
      visit "/#access_token=#{access_token}"
    else
      visit "/"
    end

    begin
      page.find('space-view')
    rescue Capybara::ElementNotFound
      fill_in 'user_email', with: 'user@example.com'
      fill_in 'user_password', with: 'password'
      check 'remember_me'
      click_button 'Sign In'
    end

    begin
      find('#overview .guiders_close', wait: 0.5).click
    rescue Capybara::ElementNotFound
    end
    page.find('space-view')
    self.access_token = page.evaluate_script('angular.element($("space-view")).injector().get("authentication").token')
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
        find('li', text: 'TestSpace', wait: 0.5).click
      rescue Capybara::ElementNotFound
        find('.dropdown-toggle').click
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
    sleep 4
  end

  def create_test_space
    find('.account .project .dropdown-toggle').click
    begin
      using_wait_time 0.5 do
        find('li', text: 'TestSpace').click
      end
      return
    rescue Capybara::ElementNotFound
      find('li', text: 'Create Space').click
      fill_in 'name', with: 'TestSpace'
      fill_in 'locale', with: 'en-US'
      click_button 'Create Space'
    end
    sleep 5
  end

  def add_button(text)
    find('.tablist-button .dropdown-toggle').click
    find('.tablist-button li', text: text).click
  end

  def nav_bar(target)
    find(".nav-bar li[data-view-type=#{target}]").click
  end

end

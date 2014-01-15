module EnvHelper
  def user          ; 'user@example.com' ; end
  def password      ; 'password'         ; end
  def test_space    ; 'TestSpace'        ; end
  def token_file    ; 'tmp/spec_token'   ; end

  if ENV['USE_QUIRELY']
    def app_host      ; 'https://app.quirely.com'     ; end
    def be_host       ; 'https://be.quirely.com'      ; end
    def marketing_host; 'https://www.quirely.com'     ; end
  else
    def app_host      ; 'http://app.joistio.com:8888' ; end
    def be_host       ; 'http://be.joistio.com:8888'  ; end
    def marketing_host; 'http://www.joistio.com:8888' ; end
  end
end

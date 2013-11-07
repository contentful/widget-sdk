module EnvHelper
  if ENV['USE_SAUCE']
    def app_host      ; 'https://app.flinkly.com'; end
    def be_host       ; 'https://be.flinkly.com' ; end
    def marketing_host; 'https://www.flinkly.com'; end
    def user          ; 'jan@contentful.com'     ; end
    def password      ; 'upeW3Kz9KkcBrd'         ; end
  else
    def app_host      ; 'http://app.joistio.com:8888' ; end
    def be_host       ; 'http://be.joistio.com:8888'  ; end
    def marketing_host; 'http://www.joistio.com:8888' ; end
    def user          ; 'user@example.com'            ; end
    def password      ; 'password'                    ; end
  end
end

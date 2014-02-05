import pytest
import os
import urllib
from subprocess import Popen
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

BROWSERSTACK_API = 'hub.browserstack.com:80/wd/hub'

""" See http://www.browserstack.com/automate/capabilities """
BROWSERS = [
  {'browserName': 'chrome'},
  {'browserName': 'firefox'},
  {'browserName': 'safari'},
  {'browserName': 'internet_explorer'}
]

USER = {
  "SUPERUSER": "F3rRTqyfQg",
  "FACULTY"  : "mHxyyRfvO7",
  "STUDENT"  : "B3yGtjkIFz"
}

@pytest.fixture(scope="module")
def tunnel(request):
  if not (request.config.getoption('--local') and
         request.config.getoption('--key')):
    return False
  
  filedir = os.path.dirname(os.path.realpath(__file__))
  jar = filedir + '/BrowserStackTunnel.jar'
  
  ''' Synchronously downloads the jar file if it doesn't already exist. '''
  if not os.path.isfile(jar):
    download =\
        urllib.urlopen('http://www.browserstack.com/BrowserStackTunnel.jar')
    with open(jar, 'wb') as out:
      out.write(download.read())
  
  """Starts a tunnel to the local server"""
  key = request.config.getoption('--key')
  host = request.config.getoption('--host')
  port = request.config.getoption('--port')
  ssl = request.config.getoption('--ssl')
  link = Popen(['java', '-jar', jar, key, 
    ','.join([ str(host),str(port),str(int(ssl)) ]) ])
  def fin():
    link.terminate()
  request.addfinalizer(fin)

def pytest_generate_tests(metafunc):
  if 'browser' in metafunc.fixturenames:
    browser_list = metafunc.config.option.browsers or BROWSERS
    metafunc.parametrize('browser', browser_list, indirect=True)

"""
   Creates a driver based on one of the passed in browser dictionaries from
   the BROWSERS array. If a key is an argument, uses Browserstack to run tests
"""
@pytest.fixture
def browser(request, tunnel):
  key = request.config.getoption('--key')
  driver = None
  if key is not None:
    url = 'http://www-data:' + key + '@' + BROWSERSTACK_API
    desired = {'acceptSslCerts': True, 'browserstack.tunnel': True}
    desired.update(request.param)
    driver = webdriver.Remote(command_executor=url,
           desired_capabilities=desired)
  else:
    name = request.param['browserName']
    driver = None
    if name == 'internet_explorer':
      name = 'ie'
    elif name.lower() == 'phantomjs':
      name = 'PhantomJS'
      cli_args.append('--ignore-ssl-errors=yes')
      cli_args = []
      driver = getattr(webdriver, name)(service_args=cli_args)
    else:
      name = name.capitalize()
      driver = getattr(webdriver, name)()
  
  def fin():
    driver.close()
  request.addfinalizer(fin)
 
  host = request.config.getoption('--host')
  def login(self, user):
    """ In a given browser, logs the given user in. This is a method
    on the browser object.
    
    Keyword Arguments
    user -- a user's NetID (see USERS dictionary)
    """
    self.get(host) # if we don't go here, we get a cross-domain error
    login_url = host + '/api/v2/account/login/authUser';
    logout_url = host + '/api/v2/account/logout';
    script = '\
      ;(function(){var xhr = new XMLHttpRequest(); \
      xhr.open("GET", "' + logout_url + '", false); \
      xhr.send(); \
      var xhr = new XMLHttpRequest(); \
      xhr.open("GET", "' + login_url + '", false);\
      xhr.setRequestHeader("Authorization", "'+ user +'");\
      xhr.send();})();'
    self.execute_script(script)
  
  import types
  driver.login = types.MethodType(login, driver)
  return driver

@pytest.fixture
def host(request):
  return request.config.getoption('--host')

def pytest_addoption(parser):
  
  ''' creates a list of dictionaries akin to the BROWSERS element '''
  parser.addoption("--browsers", metavar="BROWSERS", action="store",
      default=None,
      type=lambda x: [dict([('browserName',b)]) for b in x.lower().split(',')],
      help="List of browsers separated by commas.")

  parser.addoption("--host", metavar="TESTING_HOSTNAME", action='store',
      default='https://milo.byu.edu', type=str, help="The hostname to run on.")
  
  parser.addoption("--ssl", metavar="LOCAL_SSL", action='store', default=True,
      type=bool, help="Whether or not local host is run over SSL. Used in\
      conjunction with --local and --key. Defaults to true.")
  
  parser.addoption("--port", metavar="LOCAL_PORT", action='store', default=443,
      type=int, help="The port of the local website, tested remotely. Used in\
      conjunction with --local and --key. Defaults to 443.")
  
  parser.addoption("--local", metavar="IS_LOCAL", action='store',
      default=True, type=bool,
      help="For remote testing. Whether or not the host is local. \
            Defaults to True. Only matters if --key is set.")

  parser.addoption("--key", metavar="BROWSERSTACK_API_KEY", action='store',
      default=None, type=str,
      help="Your Browserstack key. If empty, runs locally.\n \
            if you don't have this, you can get it from \
            https://www.browserstack.com/accounts/automate")

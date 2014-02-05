import pytest
from video import Video
from time import sleep
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC 
from conftest import USER
from test_helpers import reload_db

def setup_module(module):
  reload_db()

''' Faculty owns the collection where the video belongs, and the student
    is a student of the faculty's class.'''
@pytest.mark.parametrize('account',
    [USER['SUPERUSER'], USER['FACULTY'], USER['STUDENT']])
def test_video_playback(browser, host, account):
  browser.login(account)
  url = host+ "/video/521fa57e04743b6f1ba4bac1?collection=5270162c04743b19be6ed473"
  browser.get(url)

  # now on the video page
  element = WebDriverWait(browser,3).until(
      EC.presence_of_element_located((By.TAG_NAME,'video')))
  video = Video(element)
  WebDriverWait(browser, 5).until(
      lambda x: video.ready_state == "HAVE_ENOUGH_DATA")

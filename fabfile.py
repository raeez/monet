# -*- coding: utf-8 -*-

from os.path import expanduser
from fabric.api import env, local, run, put, cd
from paramiko.config import SSHConfig
import json

import memoize.test.run

DEPLOY_DIR = '/home/ubuntu/memoize'
PYTHON = 'memoize.python'
TEMP_DIR = '/tmp/memoize'

def load_hosts(filename='conf/hosts.json'):
  try:
    with open(filename, 'r') as hosts:
      data = json.loads(hosts.read())
      if isinstance(data, list):
        return data
      return []
  except:
    return []

env.hosts = load_hosts()

def script(script_name):
  return 'sudo sh script/%s' % script_name

def python(script_name):
  return '%s script/%s' % (PYTHON, script_name)

def load_ssh_conf():
  def hostinfo(host, config):
    hive = config.lookup(host)
    if 'user' in hive:
      host = '%s@%s' % (hive['user'], host)
    if 'port' in hive:
      host = '%s:%s' % (host, hive['port'])
    return host

  try:
    config_file = file(expanduser('~/.ssh/config'))
  except IOError:
    pass
  else:
    config = SSHConfig()
    config.parse(config_file)
    keys = [config.lookup(host).get('identityfile', None) for host in env.hosts]
    env.key_filename = [key for key in keys if key is not None]
    env.hosts = [hostinfo(host, config) for host in env.hosts]

load_ssh_conf()

# ---------
# - LOCAL -
# ---------

def dev():
  import sys
  dev_script = {'darwin' : 'dev.osx', 'posix' : 'dev.ubuntu'}
  local(script(dev_script[sys.platform]))

def test():
  memoize.test.run.test_recursive('.')

  # test them servlets
  from servlet.c import app

def pack():
  test()
  local('python setup.py sdist --formats=gztar', capture=False)

# ----------
# - DEPLOY -
# ----------

def rebase(new=False):
  ITEMS = ['upstart', 'nginx', 'script',  'conf', 'celery', 'static', 'live']
  ARCHIVE = 'core.tar.gz'

  local('tar cvzhf %s %s' % (ARCHIVE, " ".join(ITEMS)))

  if new:
    run('mkdir -p %s' % DEPLOY_DIR)

  put(ARCHIVE, DEPLOY_DIR)

  local('rm %s' % ARCHIVE)

  with cd(DEPLOY_DIR):
    run('tar xf %s' % ARCHIVE)
    run('rm %s' % ARCHIVE)

def reconfig():
  rebase()
  with cd(DEPLOY_DIR):
    run(script('reconfig'))
    run(script('list'))
def bootstrap():
  rebase(new=True)

  with cd(DEPLOY_DIR):
    run(script('bootstrap'))

  deploy()
  start()
  reseed()
  list()

def deploy():

  ARCHIVE = 'memoize.tar.gz'
  DIST = local ('python setup.py --fullname', True).strip() # release name and version
  local("echo %s" % DIST)

  header = "Deploying %s" % DIST
  print "*" * len(header)
  print header
  print "*" * len(header)

  try:
    run('mkdir %s' % TEMP_DIR)
  except:
    pass # no biggie

  put('dist/%s.tar.gz' % DIST, '%s/%s' % (TEMP_DIR, ARCHIVE))

  with cd(TEMP_DIR):
    run('tar xzf %s/%s -C .' % (TEMP_DIR, ARCHIVE))
    with cd(DIST):
      run('%s setup.py install' % PYTHON)
  run('rm -rf %s' % TEMP_DIR)

  with cd(DEPLOY_DIR):
    run(script('production'))
    run(script('list'))
  retest()

# ----------
# - REMOTE -
# ----------

def list():
  with cd(DEPLOY_DIR):
    run(script('list'))

def start():
  with cd(DEPLOY_DIR):
    run(script('start'))

def restart():
  with cd(DEPLOY_DIR):
    run(script('restart'))

def reload():
  with cd(DEPLOY_DIR):
    run(script('reload'))

def retest():
  with cd(DEPLOY_DIR):
    run(python('test.py'))

def reseed():
  with cd(DEPLOY_DIR):
    run(python('seed.py'))

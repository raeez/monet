# -*- coding: utf-8 -*-

from os.path import expanduser
from fabric.api import env, local, run, put, cd
from paramiko.config import SSHConfig
import json
from lib.test.run import test_recursive

DEPLOY_DIR = '~/manhattan'
TEMP_DIR = '/tmp/manhattan'

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
  return 'sudo sh scripts/%s' % script_name

def python(script_name):
  return 'manhattan.python scripts/%s' % script_name

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
  test_recursive('.')

  #test them servlets
  from servlet.c import app
  from servlet.g import app
  from servlet.h import app

def pack():
  test()
  local('python setup.py sdist --formats=gztar', capture=False)

# ----------
# - DEPLOY -
# ----------

def rebase(new=False):
  ITEMS = ['upstart', 'nginx', 'scripts',  'conf']
  ARCHIVE = 'core.tar.gz'

  local('tar cvzf %s %s' % (ARCHIVE, " ".join(ITEMS)))
  if new:
    try:
      run('mkdir %s' % DEPLOY_DIR)
    except:
      raise Exception('Could not rebase target server')

  put(ARCHIVE, DEPLOY_DIR)
  local('rm %s' % ARCHIVE)

  with cd(DEPLOY_DIR):
    run('tar xf %s' % ARCHIVE)
    run('rm %s' % ARCHIVE)

def reconfig():
  rebase()
  with cd(DEPLOY_DIR):
    run(script('production'))
    run(script('list'))
def bootstrap():
  rebase(new=True)

  with cd(DEPLOY_DIR):
    run(script('bootstrap'))

  deploy()
  rseed()
  list()

def deploy():

  ARCHIVE = 'manhattan.tar.gz'
  DIST = local ('python setup.py --fullname').strip() # release name and version

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
      run('manhattan.python setup.py install')
  run('rm -rf %s' % TEMP_DIR)

  with cd(DEPLOY_DIR):
    run(script('production'))
    run(script('list'))
  rtest()

# ----------
# - REMOTE -
# ----------

def rlist():
  with cd(DEPLOY_DIR):
    run(script('list'))

def rstart():
  with cd(DEPLOY_DIR):
    run(script('start'))

def rstop():
  with cd(DEPLOY_DIR):
    run(script('stop'))

def rtest():
  with cd(DEPLOY_DIR):
    run(python('test.py'))

def rseed():
  with cd(DEPLOY_DIR):
    run(python('seed.py'))

# -*- coding: utf-8 -*-

from os.path import expanduser
from fabric.api import env, local, run, put, cd
from paramiko.config import SSHConfig

DEPLOY_DIR = '~/manhattan'
TEMP_DIR = '/tmp/manhattan'

def load_hosts(filename='hosts'):
  host_list = []
  with open(filename, 'r') as hosts:
      for h in hosts:
        if not h.startswith("#"):
          host_list.append(h.rstrip())
  return host_list

env.hosts = load_hosts()

def script(script_name):
  return 'sudo sh scripts/%s' % script_name

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

def pack():
  local('python setup.py sdist --formats=gztar', capture=False)

def _deploy():
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

def seed_db():
  with cd(DEPLOY_DIR):
    run('manhattan.python scripts/seed.py')

def rebase(new=False):
  ITEMS = ['upstart', 'nginx', 'scripts', 'fcgi']
  ARCHIVE = 'core.tar.gz'

  local('tar cvzf %s %s' % (ARCHIVE, " ".join(ITEMS)))
  if new:
    run('mkdir %s' % DEPLOY_DIR)
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

def deploy():
  _deploy()

def bootstrap():
  rebase(new=True)

  with cd(DEPLOY_DIR):
    run(script('bootstrap'))

  _deploy()
  seed_db()

  with cd(DEPLOY_DIR):
    run(script('list'))

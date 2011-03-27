# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

try:
    readme = open('README.rst').read()
except:
    readme = None

try:
    license = open('LICENSE').read()
except:
    license = None

setup(
  name                  = 'monet',
  version               = '0.19',
  packages              = find_packages(),
  include_package_data  = True,
  zip_safe              = False,
  author                = 'Raeez Lorgat',
  author_email          = 'raeez@mit.edu',
  description           = 'live media streaming',
  license               = license,
  long_description      = readme,

  install_requires=[
    'Flask>=0.6',
    'pymongo',
    'py-bcrypt',
    'gunicorn',
    'gevent',
    'eventlet',
    'celery',
    'flask-uploads',
    'pyzmq'
  ]
)

# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

setup(
  name = 'stream',
  version = '0.17',
  packages = find_packages(),
  include_package_data = True,
  zip_safe = False,

  author = 'Raeez Lorgat',
  author_email = 'raeez@mit.edu',
  description = 'Stream mail client',

  install_requires=['Flask>=0.6', 'pymongo', 'py-bcrypt', 'gunicorn', 'eventlet', 'greenlet']
)

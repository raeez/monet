# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

setup(
  name = 'manhattan',
  version = '0.15',
  packages = find_packages(),
  include_package_data = True,
  zip_safe = False,

  author = 'Raeez Lorgat',
  author_email = 'raeez@mit.edu',
  description = 'Manhattan payment processing gateway',

  install_requires=['Flask>=0.6', 'pymongo', 'py-bcrypt']
)

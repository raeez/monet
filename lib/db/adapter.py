# -*- coding: utf-8 -*-

from lib.config import DEBUG, syslog

if syslog is None:
  from lib.log import Logger
  log_name = 'db'
  if DEBUG is False:
    log_name += '.DEBUG'
  syslog = Logger(log_name)
syslog.create_logger('db')

class Adapter(object):
  """Abstraction over a database connection"""
  def __init__(self):
    syslog['db'].debug("Created an instance of lib.db.adapter")

  def insert(self, collection, document):
    syslog['db'].debug("Inserting document " + str(document) + " into collection " + collection)

  def find(self, collection, params={}):
    syslog['db'].debug("Searching collection " + str(collection) + " for documents with (optional) parameters:" + str(params))

  def find_one(self, collection, params={}):
    syslog['db'].debug("Searching collection " + str(collection) + " for the first document with (optional) parameters:" + str(params))

  def group_find(self, group, params={}):
    syslog['db'].debug("Searching group" + str(group) + " for documents with (optional) parameters:" + str(params))

  def group_find_one(self, group, params={}):
    syslog['db'].debug("Searching group" + str(group) + " for the first document with (optional) parameters:" + str(params))

  def delete(self, collection, _id):
    syslog['db'].debug("deleting item " + str(_id) + " from collection " + str(collection))

  def group_delete(self, group, _id):
    syslog['db'].debug("deleting item " + str(_id) + " from group " + str(group))

class AdapterConnectionError(Exception):
  pass

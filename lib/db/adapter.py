# -*- coding: utf-8 -*-

from lib.log import Logger
syslog = Logger.system_log()
syslog.create_logger('db')

class NoAdapterError(Exception):
  pass

class Adapter(object):
  """Abstraction over a database connection"""
  def __init__(self):
    syslog['db'].debug("Created an instance of lib.db.adapter")

  def atomic_append(self, collection, _id, item):
    syslog['db'].debug("Atomically appending %s into object %s in collection %s" % (str(item), str(_id), collection))

  def insert(self, collection, document):
    syslog['db'].debug("Inserting document %s into collection %s" % (str(document), collection))

  def find(self, collection, params={}):
    syslog['db'].debug("Searching collection %s for documents with (optional) parameters: %s" % (str(collection), str(params)))

  def find_one(self, collection, params={}):
    syslog['db'].debug("Searching collection %s for the first document with (optional) parameters: %s" + (str(collection), str(params)))

  def group_find(self, group, params={}):
    syslog['db'].debug("Searching group %s for documents with (optional) parameters: %s" + (str(group), str(params)))

  def group_find_one(self, group, params={}):
    syslog['db'].debug("Searching group %s for the first document with (optional) parameters: %s" + (str(group), str(params)))

  def delete(self, collection, _id):
    syslog['db'].debug("deleting item %s from collection %s" %s (str(_id), str(collection)))

  def group_delete(self, group, _id):
    syslog['db'].debug("deleting item %s from group %s" % (str(_id), str(group)))

class AdapterConnectionError(Exception):
  pass

# -*- coding: utf-8 -*-

class Adapter(object):
  """Abstraction over a database connection"""
  def __init__(self):
    # TODO logging
    print("Created an instance of lib.db.adapter")

  def insert(self, collection, document):
    # TODO logging
    print("Inserting document " + str(document) + " into collection " + collection)

  def find(self, collection, params={}):
    # TODO logging
    print("Searching collection " + str(collection) + " for documents with (optional) parameters:" + str(params))

  def find_one(self, collection, params={}):
    # TODO logging
    print("Searching collection " + str(collection) + " for the first document with (optional) parameters:" + str(params))

  def group_find(self, group, params={}):
    # TODO logging
    print("Searching group" + str(group) + " for documents with (optional) parameters:" + str(params))

  def group_find_one(self, group, params={}):
    # TODO logging
    print("Searching group" + str(group) + " for the first document with (optional) parameters:" + str(params))

  def delete(self, collection, _id):
    print("deleting item " + str(_id) + " from collection " + str(collection))

  def group_delete(self, group, _id):
    print("deleting item " + str(_id) + " from group " + str(group))

class AdapterConnectionError(Exception):
  pass

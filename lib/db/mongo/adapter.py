# -*- coding: utf-8 -*-

import pymongo

import lib.config
from lib.log import Logger
syslog = Logger.system_log()
from lib.db.adapter import Adapter, AdapterConnectionError
from lib.db.mongo.config import HOST, SAFE, REPLICATE_MIN
from lib.db.objectid import ObjectId

def enforce_valid_id(_id):
  """
  ensure that the supplied _id is in a form mongo can understand
  """
  if (not _id):
    return _id

  if isinstance(_id, basestring):
    return ObjectId(_id)

  assert isinstance(_id, ObjectId), "Invalid _id object for query %r\nMust be string or ObjectId" % params

  return _id
  
def map_id(params):
  """
  ensure that object id's are being passed in a form mongo can understand
  """
  _id = params.get("_id", False)
  if _id:
    params["_id"] = enforce_valid_id(_id)
  return params
  
class MongoAdapter(Adapter):
  """Abstraction and management of MongoDB instances"""

  def __init__(self, db_name='monet'):
    super(MongoAdapter, self).__init__()

    try:
      self.db = pymongo.Connection(HOST[0], HOST[1])[db_name]
    except pymongo.errors.AutoReconnect:
      syslog['db'].critical("Could not connect to MongoDB @ %s:%s" % (HOST[0], HOST[1]))
      raise AdapterConnectionError

    syslog['db'].debug("Created a MongoDB connection to db:monet")

  def save(self, collection, document):
    super(MongoAdapter, self).insert(collection, document)
    self.db[collection].save(document, safe=SAFE, w=REPLICATE_MIN)
    syslog['db'].debug("Added a document to a mongo database")

  def find(self, collection, params={}):
    return list(self.db[collection].find(map_id(params)))

  def find_one(self, collection, params={}):
    return self.db[collection].find_one(map_id(params))

  def group_find(self, group, params={}):
    results = []
    for collection in self.db.collection_names():
      if group in collection:
        results.append(list(self.db[collection].find(params)))
    return results


  def group_find_one(self, group, params={}):
    results = []
    for collection in self.db.collection_names():
      if group in collection:
        results.append(list(self.db[collection].find_one(params)))
    return results

  def delete(self, collection, _id):
    self.db[collection].remove({"_id" : enforce_valid_id(_id)})

  def group_delete(self, group, _id):
    for collection in self.db.collection_names():
      if group in collection:
        self.delete(collection, enforce_valid_id(_id))
    return

  def atomic_append(self, collection, query, item):
    super(MongoAdapter, self).atomic_append(collection, map_id(query), item)
    self.db[collection].update(map_id(query),
                               { "$push" : item })

  def atomic_set(self, collection, query, item):
    super(MongoAdapter, self).atomic_set(collection, map_id(query), item)
    self.db[collection].update(map_id(query),
                               { "$set" : item })
  
  def save(self, collection, document):
    super(MongoAdapter, self).insert(collection, document)
    self.db[collection].save(document, safe=SAFE, w=REPLICATE_MIN)
    syslog['db'].debug("Added a document to a mongo database")

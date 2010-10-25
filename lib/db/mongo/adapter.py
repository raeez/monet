import pymongo

from lib.db.adapter import Adapter, AdapterConnectionError
from config import HOST, PORT, SAFE, REPLICATE_MIN

class MongoAdapter(Adapter):
  """Abstraction and management of MongoDB instances"""

  def __init__(self):
    super(MongoAdapter, self).__init__()

    try:
      self.db = pymongo.Connection(HOST, PORT).manhattan
    except pymongo.errors.AutoReconnect:
      # TODO add logging "appopriately" -> propogate message
      raise AdapterConnectionError

    # TODO add logging
    print("Created a MongoDB connection to db:manhattan")

  def save(self, collection, document):
    super(MongoAdapter, self).insert(collection, document)
    self.db[collection].save(document, safe=SAFE, w=REPLICATE_MIN)
    # TODO add logging
    print("Added a document to a mongo database")

  def find(self, collection, params={}):
    return list(self.db[collection].find(params))

  def find_one(self, collection, params={}):
    return self.db[collection].find_one(params)

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
    self.db[collection].remove({"_id" : _id})

  def group_delete(self, group, _id):
    for collection in self.db.collection_names():
      if group in collection:
        self.delete(collection, _id)
    return


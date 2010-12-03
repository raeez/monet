# -*- coding: utf-8 -*-

from pymongo.son_manipulator import SONManipulator
import json
from lib.db.objectid import ObjectId

registered_containers = {}

def get_container_pointer(id):
  # TODO actually implement, potentially as another SON Transform?

  if isinstance(id, ObjectId):
    return id

  assert isinstance(id, unicode)
  id = str(id)
  try:
    obj = ObjectId(id)
  except Exception:
    return None
  return obj

class ResponseEncoder(json.JSONEncoder): # represent a container in json
  """docstring for ObjectIDEncoder"""
  def default(self, obj):
    if isinstance(obj, ObjectId):
      return str(obj)
    if isinstance(obj, property):
      print 'is property: %r:%r' % (property, dir(property))
      return self.default(obj.fget())
    return json.JSONEncoder.default(self, obj)


class ContainerTransform(SONManipulator): # build a container from json
  """SON Transform for containers"""

  def transform_outgoing(self, son, collection):

    if "_type" in son and son["_type"] in registered_containers:
      return registered_containers[son["_type"]](son)

    for (key, value) in son.items():
      if isinstance(value, dict):
        if "_type" in value and value["_type"] in registered_containers:
          son[key] = registered_containers[value["_type"]](value)
        else:
          son[key] = self.transform_outgoing(value, collection)
    return son

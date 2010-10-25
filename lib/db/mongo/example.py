from pymongo import Connection

#ensure mongod is running!

connection = Connection('localhost', 27017)

#lazy db creation/access
db = connection.test_database
db = connection['test-database']

db.collection_names() #iterable/unicode

#lazy collection creation/access
collection = db.test_collection
collection = db['test-collection']



from datetime import datetime

#example json document
doc = { "member" : "value",
        "key" : "value2",
        "key2" : 4,
        "date" : datetime.uctnow() } # this works!

#inserts
collection.insert(doc) #get back an object id
collection.insert([doc, doc, doc]) #get back a list of object id's

# queries - single
collection.find_one() #first doc
collection.find_one({"member" : "value"}) #first match

# queries - iternble
collection.find() # iterable all
collection.find({"author" : "mike"}) # iterable matching

# count queries
collection.count()
collection.find({"author" : "mike"}).count()

#range queries
d = datetime(2010, 11, 12, 12)
for document in collection.find({"date" : {"$lt" : d}}).sort("author"):
  print(document)

#explain
collection.find({"date" : {"$lt" : d}}).sort("author").explain()["cursor"]
collection.find({"date" : {"$lt" : d}}).sort("author").explain()["nscanned"]

#indexing
from pymongo import ASCENDING, DESCENDING
collection.create_index([ ("date", DESCENDING),
                          ("author", ASCENDING) ])

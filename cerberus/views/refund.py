from flask import Module, request, abort
from lib.api.response import out, Response
from lib.db import Refund
from cerberus.log import log

refund_module = Module(__name__)

resp = Response(log)

@refund_module.route('/transaction/refund', methods=['GET', 'POST'])
@resp.api_request
@resp.api_get(Refund)
def refund():
  if request.method == 'POST':
    r = Refund()

    for key in request.form:
      r[key] = request.form[key]

    try:
      r._validate()

    except Exception as e:
      return out(e), 400

    finally:
      if r._validated is True:
        #attempt to run this refund
        r.save() # save to db unprocessed
        r.process() #attempt to process
        r.save() # save to db with result
    return out(r)
  abort(404)

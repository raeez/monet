from flask import Module, request, abort
from lib.api.response import out, api_request, api_get
from lib.db import Charge

charge_module = Module(__name__)

@charge_module.route('/transaction/charge', methods=['GET', 'POST'])
@api_request
@api_get(Charge)
def charge():
  if request.method == 'POST':
    c = Charge()

    for key in request.form:
      c[key] = request.form[key]

    try:
      c._validate()

    except Exception as e:
      return out(e), 400

    finally:
      if c._validated is True:
        #attempt to run this charge
        c.save() # save to db unprocessed
        c.process() #attempt to process
        c.save() # save to db with result
    return out(c)
  abort(404)

from flask import Module, abort
from lib.api.response import api_request, api_get
from lib.db import ProcessorKey

processor_key_module = Module(__name__)

@processor_key_module.route('/key/processor', methods=['GET'])
@api_request
@api_get(ProcessorKey)
def processor_key():
  abort(404)

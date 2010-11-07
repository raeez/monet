from flask import Module

example = Module(__name__)

@example.route('/')
def index():
  return "You've reached gaia!"

def test(self, app, test_params):
  pass

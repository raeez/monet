from flask import Module

example = Module(__name__)

@example.route('/')
def index():
  return "You've reached gaia!"

from flask import Flask
from gaia.views.example import example

gaia = Flask('gaia')
gaia.register_module(example)

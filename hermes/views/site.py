from flask import Module, session, redirect, url_for, request, render_template
from lib.db import *
from hermes.log import log

site = Module(__name__)

@site.route('/')
def index():
  log['request'].debug("request %s" % repr(request.path))
  if 'email' in session:
    return render_template('greeting.html')
  return render_template('index.html')

@site.route('/login', methods=['GET', 'POST'])
def login():
  log['request'].debug("request %s" % repr(request.path))
  if 'email' in session:
    return redirect(url_for('index'))
  elif request.method == 'POST':
    log['login'].debug("request %s" % repr(request.form))
    #auth
    m = Merchant.find_one({'email' : request.form['email']})
    if m is None:
      return redirect(url_for('login'))

    if str(m.password) == str(request.form['password']):
      session['email'] = request.form['email']
      log['login'].debug(session['email'])
      return redirect(url_for('index'))
  return render_template('login.html')

@site.route('/logout')
def logout():
  log['request'].debug("request %s" % repr(request.path))
  log['logout'].debug(session['email'])
  session.pop('email', None)
  return redirect(url_for('index'))

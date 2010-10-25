from flask import Module, session, redirect, url_for, request, render_template
from lib.db import *

site = Module(__name__)

@site.route('/')
def index():
    if 'email' in session:
      return render_template('greeting.html')
    return render_template('index.html')

@site.route('/login', methods=['GET', 'POST'])
def login():
    if 'email' in session:
      return redirect(url_for('index'))
    elif request.method == 'POST':
      #auth
      m = Merchant.find_one({'email' : request.form['email']})
      if str(m.password) == str(request.form['password']):
        session['email'] = request.form['email']
        return redirect(url_for('index'))
    return render_template('login.html')

@site.route('/logout')
def logout():
    # remove the username from the session if its there
    session.pop('email', None)
    return redirect(url_for('index'))

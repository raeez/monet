# -*- coding: utf-8 -*-

from flask import Module, session, redirect, url_for, request, render_template, flash, abort
from memoize.model import User, Memory, Photo
from memoize.upload.helpers import create_memory, upload_photo, build_memory_stream, claimed, claim_memory, rand_photo, getArtifactsFromMemory
from lib.db.objectid import ObjectId
import bcrypt
import random
import json

from client.log import log

main_module = Module(__name__)

###########
## INDEX ##
###########

@main_module.route('/')
def index():
  log['request'].debug("request %s" % repr(request.path))

  #if 'email' in session:
  #  return redirect(url_for('stream'))
  return render_template('index.html')

###########
## USERS ##
###########

@main_module.route('/new_user', methods=['GET', 'POST'])
def new_user():
  if not request.form['email'] or not request.form['new_pass'] or not request.form['confirm']:
    flash("The form submission broke. Please refresh and try again")
    return redirect(request.referrer)

  email = request.form['email']
  password = request.form['new_pass']
  confirm = request.form['confirm']

  if password != confirm:
    flash("The passwords must match. Please send us matching passwords")
    return redirect(request.referrer)

  u = User()
  u.name = email
  u.email = email
  u.set_password(password)
  u.save()

  session['email'] = u.email
  session['id'] = str(u._id)
  session['password'] = password
  log['login'].debug(session['email'])

  return redirect(request.referrer)

@main_module.route('/check_for_email', methods=['GET', 'POST'])
def check_for_email():
  if not request.form['email']:
    abort(400)
  user = User.find_one({'email' : request.form['email']})

  if user is None:
    return '0'
  else:
    return '1'

@main_module.route('/login', methods=['GET', 'POST'])
def login():
  session['fix_email'] = ''
  log['request'].debug("request %s" % repr(request.path))

  if 'email' in session:
    return redirect(request.referrer)
  elif request.method == 'POST':
    log['login'].debug("request %s" % repr(request.form))
    #auth
    user = User.find_one({'email' : request.form['email']})

    #if this user has not logged in before
    if user is None:
      flash("Hmm.. User doesn't exist, please make an account")
      return redirect(request.referrer)

    if bcrypt.hashpw(request.form['password'], user.password) == user.password:
      session['email'] = request.form['email']
      session['id'] = str(user._id)
      session['password'] = request.form['password']
      log['login'].debug(session['email'])
      return redirect(request.referrer)
    else:
      flash("Oh no! This is the wrong password. Please try again")
      session['fix_email'] = request.form['email']
      return redirect(request.referrer)
  return redirect(request.referrer)

@main_module.route('/claim/<id>', methods=['GET'])
def claim(id):
  m = Memory.find_one({ "_id" : id })
  if m:
    return claim_memory(m)
  abort(400)


@main_module.route('/logout')
def logout():
  log['request'].debug("request %s" % repr(request.path))
  if 'email' in session:
    log['logout'].debug(session['email'])
  session.pop('email', None)
  session.pop('fix_email', None)
  return redirect(url_for('index'))

###################
## NOT LOGGED IN ##
###################

@main_module.route('/create', methods=['POST'])
def create():
  return upload_photo(request.form.get('memory_id', None), request.form.get("multi_session", None))

@main_module.route('/new', methods=['GET'])
def new():
  return render_template('index.html')

@main_module.route('/memory/<id>', methods=['GET'])
def memory(id):
  m = Memory.find_one({"_id" : id})

  if not m:
    abort(404)
  else:
    from client.app import client as app
    if 'email' in session:
      claim_memory(m)

    show_hidden = int(request.args.get('show_hidden', '0'))

    artifacts = getArtifactsFromMemory(m, 0, 100, show_hidden)

    # Split things into rows:
    rows = []
    current_row = []
    row_accumulator = 0
    for artifact in artifacts:
      current_row.append(artifact)
      row_accumulator += artifact['width']
      if row_accumulator >= 955:
        rows.append(current_row)
        current_row = []
        row_accumulator = 0
    if len(current_row) > 0:
        rows.append(current_row)

    return render_template('memory.html', memory={'claimed' : not (not m.user), 'id' : m._id, 'name' : m.name, 'rows' : rows, 'visible' : show_hidden})

@main_module.route('/get_artifacts/<id>', methods=['GET', 'POST'])
def get_artifact_containers(id):
  m = Memory.find_one({ "_id" : id })

  offset = int(request.form.get('offset', '0'))
  numArtifacts = int(request.form.get('numArtifacts', '100'))
  showHidden = int(request.form.get('show_hidden', '0'))

  if not m:
    abort(404)
  else:
    artifacts = getArtifactsFromMemory(m, offset, numArtifacts, showHidden)

  return json.dumps(artifacts)

@main_module.route('/toggle_visibility', methods=['POST'])
def toggle_visibility():
  if not request.form['visibility'] or not request.form['id']:
    abort(400)

  try:
    visibility = int(request.form['visibility'])
  except ValueError:
    abort(403)

  p = Photo.find_one({ "_id" : request.form['id'] })
  if p:
    if visibility == 1:
      p.visible = 0
    elif visibility == 0:
      p.visible = 1
    else:
      abort(403)
    p.save()
    return '1'

  abort(403)

@main_module.route('/rename_memory', methods=['POST'])
def rename():
  if not request.form['new_name'] or not request.form['id']:
    abort(400)

  m = Memory.find_one({ "_id" : request.form['id'] })
  if m:
    if claimed(m):
      if ('email' in session) and (m.user == session['id']):
        m.name = request.form['new_name']
        m.save()
        return m.name
    else:
      m.name = request.form['new_name']
      m.save()
      return m.name

  abort(403)

###############
## LOGGED IN ##
###############

@main_module.route('/stream')
def stream():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' not in session and 'id' not in session:
    return redirect(url_for('login'))

  return render_template('stream.html', stream=build_memory_stream())

@main_module.route('/get_rand_photo', methods=['GET'])
def get_rand_photo():
  if not request.args['mem_id']:
    abort(400)

  m = Memory.find_one({ "_id" : request.args['mem_id'] })

  if m:
    photo = rand_photo(m)
    if photo:
      return photo
    else:
      abort(400)
  else:
    abort(404)

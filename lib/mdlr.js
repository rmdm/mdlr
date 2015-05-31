"use strict";

var Promise = require('bluebird'),
    _ = require('lodash'),
    modules = require('../mdlr.config.json').modules,
    Scope = require('./util/Scope'),
    Loader = require('./util/Loader'),
    errors = require('./util/errors')

var global = new Scope(),
    loader = new Loader(global)

global.register('modules', new Scope())
global.register('Scope', Scope)
global.register('Promise', Promise)
global.register('_', _)
global.register('load', loader.load.bind(loader))
global.register('unload', loader.unload.bind(loader))

_.each(errors, function (e, k) { global.register(k, e) })

global.freeze()

loader.load(modules)

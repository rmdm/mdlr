"use strict";

var _ = require('lodash'),
    Promise = require('bluebird'),
    Scope = require('./Scope'),
    CircularDependencyError = require('./errors').CircularDependencyError

module.exports = Loader

function Loader (global, options) { 
    options = options || { repo: '../../repository' }
    this.global = global
    this.modules = global.get('modules')
    this.list = []
    this.repo = options.repo
    this.currentOp = Promise.resolve()
}

Loader.prototype.forgeModules = function () {
    this.modules = new Scope()
}

Loader.prototype.replaceModules = function () {
    this.global.get('modules').populate(this.modules)
}

Loader.prototype.restoreModules = function () {
    this.modules = this.global.get('modules')
}

Loader.prototype.load = function (ids) {
    this.addDependencies(ids)
    return this._load()
}

Loader.prototype.unload = function (ids) {
    this.dropDependents(ids)
    return this._load()
}

Loader.prototype.addDependencies = function (ids) {
    this.list = _.uniq(this.list.concat(ids))
    _.each(ids, function (id) {
        this.addDependencies(_.difference(this.deps(id), this.list))
    }, this)
}

Loader.prototype.dropDependents = function (ids) {
    this.list = _.difference(this.list, [].concat(ids))
    _.each(ids, function (id) {
        this.dropDependents(_.filter(this.list, function (item) {
            return this.deps(item).indexOf(id) !== -1
        }, this))
    }, this)
}

Loader.prototype._load = function () {

    var loader = this

    if (loader.currentOp.isPending()) {
        loader.currentOp.cancel()
    }

    loader.forgeModules()

    return loader.currentOp = Promise.resolve()
        .then(function () {
            return loader.sort(
                _.map(loader.list, loader.deps.bind(loader)),
                loader.list,
                _.map(loader.list, loader.module.bind(loader))
            )
        })
        .each(function (module) {
            return Promise.resolve()
            .then(function () {
                var f = module.config.pop()
                return f.apply(null, loader.inject(module.id, module.config))
            })
            .then(function () {
                if (loader.modules.get(module.id)) {
                    loader.modules.get(module.id).freeze()
                }
            })
        })
        .then(function () { loader.replaceModules() })
        .catch(function (reason) { loader.restoreModules(); throw reason })
        .cancellable()
}

Loader.prototype.module = function (id) {
    return [].concat(require(this.repo + '/' + id))
}

Loader.prototype.deps = function (id) {
    return _.chain(this.module(id).slice(0, -1))
        .filter(function (dep) {
            return dep.indexOf(':') !== -1
        })
        .map(function (dep) {
            return dep.split(':')[0]
        })
        .value()
}

Loader.prototype.sort = function (deps, ids, modules) {
    var skeleton = _.range(modules.length)
    skeleton.sort(function (i, j) {
        var a = deps[i].indexOf(ids[j]),
            b = deps[j].indexOf(ids[i])

        if (a !== -1 && b !== -1) {  
            throw new CircularDependencyError([
                'Circular dependency between modules',
                ids[i], 'and', ids[j] 
            ].join(' ')) 
        }
        if (a !== -1) { return 1 }
        if (b !== -1) { return -1 }
        return 0
    })
    return _.map(skeleton, function (idx) {
        return { id: ids[idx], config: modules[idx] }
    })
}

Loader.prototype.inject = function (id, deps) {
    return _.map(deps, function (dep) {

        if (dep === 'export') {
            return this.modules.register(id, new Scope()).scope
        }

        if (dep === 'require') {
            return this.require.bind(this, id)
        }

        return this.require(id, dep)

    }, this)
}

Loader.prototype.require = function (id, dep) {

    if (dep[0] === '$') {
        dep = dep.slice(1)
        return require(this.repo + '/' + id + '/node_modules/' + dep)
    }

    dep = dep.split(':')

    if (dep.length === 1 && dep[0] !== 'modules') {
        return this.global.get(dep[0])
    } else if (dep.length === 2) {
        var ns = dep[0],
            name = dep[1]
        if (name && this.modules.has(ns)) {
            return this.modules.get(ns).get(name)
        } else if (this.modules.has(ns)) {            
            return this.modules.get(ns).scope
        }
    }

    return undefined

}

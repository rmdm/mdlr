"use strict";

var _ = require('lodash')

module.exports = Scope

function Scope () {
    this.scope = Object.create(null)
}

Scope.prototype.register = function (key, what) {
    return this.scope[key] = what
}

Scope.prototype.get = function (key) {
    return this.scope[key]
}

Scope.prototype.freeze = function () {
    Object.freeze.call(null, this)
}

Scope.prototype.has = function (id) {
    return Object.prototype.hasOwnProperty.call(this.scope, id)
}

Scope.prototype.empty = function () {
    _.each(this.scope, function (v, k) {
        delete this.scope[k]
    }, this)
}

Scope.prototype.populate = function (scope) {
    this.empty()
    _.extend(this.scope, scope.scope)
}

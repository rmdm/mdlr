var inherits = require('util').inherits

inherits(CircularDependencyError, Error)

function CircularDependencyError (message) {
    Error.call(this, message)
}

module.export = {
    CircularDependencyError: CircularDependencyError
}

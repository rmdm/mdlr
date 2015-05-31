module.exports = ['example_extensible:', function (extensible) {

    extensible.values.push.apply(extensible.values, ['a', '\n', 'b', '\n', 'c'])
    extensible.start()

}]

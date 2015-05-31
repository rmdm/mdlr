module.exports = [
    '$through2', 
    'export', 
function (
    through,
    exp
) {

    exp.values = []

    exp.start = function () {
        var t = through()
        t.pipe(process.stdout)
        exp.values.forEach(function (v) {
            t.write(v)
        })
        t.end
    }

}]

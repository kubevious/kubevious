module.exports.makeRelativeName = function(parentName, name) {
    var prefix = parentName + "-";
    if (name.startsWith(prefix)) {
        return name.substring(prefix.length);
    }
    return name;
}
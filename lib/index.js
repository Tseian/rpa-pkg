module.exports = {
    validator: new require('jsonschema').Validator(),
    fs: require("fs"),
    minimist: require("minimist"),
    path: require("path"),
    manifestValidate: require("./manifestValidate"),
    javaScriptObfuscator: require('javascript-obfuscator').obfuscate,
    lzString: require("lz-string"),
    $: require("cheerio")
}
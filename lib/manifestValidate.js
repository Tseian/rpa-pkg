const Validator = require('jsonschema').Validator
const mainJsonSchema = {
    id: "mainJsonSchema",
    type: "object",
    properties: {
        "name": { type: "String" },
        "description": { type: "String" }
    }
};
module.exports = (filename) => {
    let mainjson = require(filename);
    delete require.cache[filename];
    let result = new Validator().validate(mainjson, mainJsonSchema);
    if (!result.valid) throw result.erros[0];
    return true;
}

const Validator = require('jsonschema').Validator;
const validator = new Validator();
const mainJsonSchema = {
    id: "mainJsonSchema",
    type: "object",
    properties: {
        "name": { type: "string" },
        "description": { type: "string" },
        "version": { type: "number" },
    }
};
module.exports = (filename) => {
    let mainjson = require(filename);
    delete require.cache[filename];
    let result = validator.validate(mainjson, mainJsonSchema);
    if (result.errors[0]) throw result.errors[0];
    return true;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynzResolver = dynzResolver;
const resolvers_1 = require("@hookform/resolvers");
const validate_1 = require("dynz/validate");
const react_hook_form_1 = require("react-hook-form");
function parseDynzErrors(dynzErrors, validateAllFieldCriteria, messageTransformer) {
    const errors = {};
    for (const error of dynzErrors) {
        const { path, message, code } = error;
        const _path = path.slice(2);
        const _message = messageTransformer ? messageTransformer(error) : message;
        if (!errors[_path]) {
            errors[_path] = {
                message: _message,
                type: code
            };
        }
        if (validateAllFieldCriteria) {
            const types = errors[_path]?.types;
            const messages = types && types[code];
            errors[_path] = (0, react_hook_form_1.appendErrors)(_path, validateAllFieldCriteria, errors, code, messages
                ? [].concat(messages, _message)
                : message);
        }
    }
    return errors;
}
function dynzResolver(schema, currentValues, schemaOptions, resolverOptions = {}) {
    return async (values, _, options) => {
        const result = (0, validate_1.validate)(schema, currentValues, values, schemaOptions);
        options.shouldUseNativeValidation &&
            (0, resolvers_1.validateFieldsNatively)({}, options);
        console.log(result);
        if (result.success === false) {
            return {
                values: {},
                errors: (0, resolvers_1.toNestErrors)(parseDynzErrors(result.errors, !options.shouldUseNativeValidation &&
                    options.criteriaMode === 'all', resolverOptions.messageTransformer), options)
            };
        }
        return {
            errors: {},
            values: resolverOptions.raw ? values : result.values,
        };
    };
}

const Joi = require('joi');

// Define schema for user registration validation
const registerValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });

    return schema.validate(data);
};
// Login validation schema
const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Invalid email format',
            'any.required': 'Email is required'
        }),
        password: Joi.string().required().messages({
            'any.required': 'Password is required'
        }),
    });
    return schema.validate(data, { abortEarly: false }); // abortEarly: false returns all validation errors
};

module.exports = { registerValidation, loginValidation };

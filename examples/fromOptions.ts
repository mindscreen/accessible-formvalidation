import {
    IErrorHandlerBaseOptions,
    IErrorHandlerOptions,
    IValidationInstanceOptions,
    Validation,
} from '../src/validation';
import {
    EmailValidator,
    NumberRangeValidator,
    NumberValidator,
    RequiredValidator,
} from '../src/validation/validators';


const form = document.querySelector('form');
if (!form) {
    throw new Error('No form');
}

// avoid submitting form for demo purposes
form.addEventListener('submit', e => {
    e.preventDefault();
});


// prepare validation instance
// validation objects can be instantiated for multiple forms with differing
// options, becoming a "validation instance"
const validation = new Validation<
        IValidationInstanceOptions,
        // allow options for the selected error handler
        IErrorHandlerBaseOptions & Partial<IErrorHandlerOptions>
    >();


// configure validators
validation
    .registerValidator(RequiredValidator)
    .registerValidator(EmailValidator)
    .registerValidator(NumberValidator)
    .registerValidator(NumberRangeValidator);


// initialize validation instance for a certain form
const vi = validation.init(form, {
    /* validationInstanceOptions: {
            onSubmit(validationResult) {
                console.info('form submitted. valid: %s', validationResult);
            },
        }, */
    errorHandlerOptions: {
        labels: {
            errorListTitle: 'Please correct the following errors in the form:',
        },
        translations: {
            validationMessages: {
                required: label => `"${label}" is required`,
                email: label => `"${label}" is not a valid email address`,
                number: label => `"${label}" may only contain numbers`,
                maxVal: (label, max) => `"${label}" has to be less than ${max}`,
                minVal: (label, min) => `"${label}" has to be greater than ${min}`,
                exactVal: (label, val) => `"${label}" has to be ${val}`,
                rangeVal: (label, min, max) => `"${label}" has to be greater than ${min} and less than ${max}`,
            },
        },
    },
});

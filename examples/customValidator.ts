import { IErrorHandlerOptions } from '../src/validation/error-handler';
import { IErrorHandlerBaseOptions } from '../src/validation/error-handler.types';
import { Validation } from '../src/validation/validation';
import { IValidationInstanceOptions } from '../src/validation/validation-instance';
import {
    RequiredValidator,
    ValidatorInterface,
} from '../src/validation/validators';


const form = document.querySelector('form');
if (!form) {
    throw new Error('No form');
}

// avoid submitting form for demo purposes
form.addEventListener('submit', e => {
    e.preventDefault();
});


// create custom validator
const DigitSum: ValidatorInterface<{expected: number, actual: number}> = {
    getIdentifier: () => 'digitsum',
    /**
     * Checks whether the respective input should be validated with this validator
     */
    isApplicable: input => {
        // we want a data-sum value to be numeric and > 0
        if (!input.hasAttribute('data-sum')) return false;
        const sum = Number.parseInt(input.getAttribute('data-sum') ?? '');

        if (Number.isNaN(sum) || sum <= 0) return false;

        return true;
    },
    /**
     * Given callbacks for validation error and success, the validation function
     * determines which callback to call
     */
    validate: input => (onError, onSuccess) => {
        const value = input.value;
        if (value.length === 0)
            return onSuccess();

        const target = Number.parseInt(input.getAttribute('data-sum') ?? '');

        const digits = value.split('').filter(c => /\d/.test(c)).map(Number);
        const sum = digits.reduce((s, d) => s + d, 0);

        if (target === sum)
            return onSuccess();

        // fill the args passed to the validation message function
        return onError({
            expected: target,
            actual: sum,
        });
    },
    /**
     * Generate a validation message.
     * This could use the translated labels. See existing validators for references
     */
    getValidationMessage: (label, args) =>
        `${label} should contain digits with sum ${args.expected}, was ${args.actual}`,
};

const validation = new Validation<IValidationInstanceOptions, IErrorHandlerBaseOptions & Partial<IErrorHandlerOptions>>();


// configure validators
validation
    .registerValidator(RequiredValidator)
    // add our custom validator
    .registerValidator(DigitSum);


validation.init(form, {
    errorHandlerOptions: {
        labels: {
            errorListTitle: 'Please correct the following errors in the form:',
        },
        translations: {
            validationMessages: {
            },
        },
    },
});

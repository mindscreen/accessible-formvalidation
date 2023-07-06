import { ValidatorInterface } from './validator-interface';
import { AbstractValidator } from './abstract-validator';

/**
 * Validates a form-element to contain a valid number.
 * This will run for `input[type=number]` or can be forced for inputs with
 * `[data-validate=number]`.
 */
export const NumberValidator: ValidatorInterface = {
    getIdentifier: () => 'number',
    isApplicable: input => AbstractValidator.isApplicable(input)
        && (input.getAttribute('type') === 'number'
            || input.matches(`[data-validate~="${NumberValidator.getIdentifier()}"]`)
        ),
    validate: input =>
        (onError, onSuccess) => {
            if (/^-?[0-9]+(\.[0-9]+)?$/.test(input.value)) {
                onSuccess();
            } else {
                onError();
            }
        },
    getValidationMessage: (label, args, translationLabels) =>
        translationLabels?.validationMessages[NumberValidator.getIdentifier()]?.(label) || `${label} must be a valid number`,
};

import { ValidatorInterface } from './validator-interface';
import { AbstractValidator } from './abstract-validator';

/**
 * Validates an input field to contain a valid email
 */
export const EmailValidator: ValidatorInterface = {
    getIdentifier: () => 'email',
    isApplicable: (input: HTMLInputElement) => AbstractValidator.isApplicable(input)
        && input.tagName.toLowerCase() === 'input'
        && input.getAttribute('type') === 'email',
    validate: input =>
        (onError, onSuccess) => {
            const value = input.value;
            let valid = false;
            if (value.trim().length === 0) {
                onSuccess();
                return;
            } else if (input.validity) {
                valid = !input.validity.typeMismatch;
            } else {
                const Regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
                valid = Regex.test(value);
            }
            if (valid) {
                onSuccess();
            } else {
                onError();
            }
        },
    getValidationMessage: (label, _, translationLabels) =>
        translationLabels?.validationMessages[EmailValidator.getIdentifier()]?.(label) || `${label}: ${EmailValidator.getIdentifier()}`,
};

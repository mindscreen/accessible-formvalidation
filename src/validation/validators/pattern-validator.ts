import { ValidatorInterface } from './validator-interface';
import { AbstractValidator } from './abstract-validator';

export const PatternValidator: ValidatorInterface = {
    getIdentifier: () => 'pattern',
    isApplicable: input => AbstractValidator.isApplicable(input)
        && input.hasAttribute('pattern'),
    validate: input =>
        (onError, onSuccess) => {
            const value = input.value;
            let valid = false;
            if (value.trim().length === 0) {
                onSuccess();
                return;
            } else if (input.validity) {
                valid = !input.validity.patternMismatch;
            } else {
                const pattern = new RegExp(input.getAttribute('pattern'));
                valid = pattern.test(value);
            }
            if (valid) {
                onSuccess();
            } else {
                onError();
            }
        },
    getValidationMessage: (label, args, translationLabels) =>
        translationLabels?.validationMessages[PatternValidator.getIdentifier()]?.(label) || `${label} has a wrong format`,
};

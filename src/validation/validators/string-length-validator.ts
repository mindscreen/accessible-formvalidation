import { ValidatorInterface } from './validator-interface';
import { AbstractValidator } from './abstract-validator';

type StringLengthValidationResult = {
    min?: number,
    max?: number,
}

/**
 * Tests for a required input length.
 * Next to the native `maxlength` attribute it will look for a `minlength`
 * attribute on the element.
 */
export const StringLengthValidator: ValidatorInterface<StringLengthValidationResult> = {
    getIdentifier: () => 'string-length',
    isApplicable: input => AbstractValidator.isApplicable(input)
        && (input instanceof HTMLTextAreaElement
            || (input instanceof HTMLInputElement
                && input.getAttribute('type') !== 'checkbox'
                && input.getAttribute('type') !== 'radio'
            )
        ),
    validate: input =>
        (onError, onSuccess) => {
            const value = input.value;
            if (value === '') {
                onSuccess();
                return;
            }
            const min = input.getAttribute('minlength');
            const max = input.getAttribute('maxlength');
            let minVal: number;
            let maxVal: number;
            const args: StringLengthValidationResult = {};
            let valid = true;
            if (min !== null) {
                minVal = Number.parseInt(min);
                if (!Number.isNaN(minVal)) {
                    args.min = minVal;
                    if (value.length < minVal) {
                        valid = false;
                    }
                }
            }
            if (max !== null) {
                maxVal = Number.parseInt(max);
                if (!Number.isNaN(maxVal)) {
                    args.max = maxVal;
                    if (value.length > maxVal) {
                        valid = false;
                    }
                }
            }
            if (valid) {
                onSuccess(args);
            } else {
                onError(args);
            }
        },
    getValidationMessage: (label, args, translationLabels) => {
        if (args.min === undefined) {
            return translationLabels?.validationMessages['maxLength']?.(label, args.max) || `${label} needs to be shorter than ${args.max} characters`;
        }
        if (args.max === undefined) {
            return translationLabels?.validationMessages['minLength']?.(label, args.min) || `${label} needs to be longer than ${args.min} characters`;
        }
        if (args.max === args.min) {
            return translationLabels?.validationMessages['exactLength']?.(label, args.min) || `${label} needs to be ${args.min} characters long`;
        }
        return translationLabels?.validationMessages['rangeLength']?.(label, args.min, args.max) || `${label} needs to have ${args.min} to ${args.max} characters long`;
    },
};

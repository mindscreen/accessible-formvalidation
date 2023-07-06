import { ValidatorInterface } from './validator-interface';
import { AbstractValidator } from './abstract-validator';

type NumberRangeValidationResult = {
    min?: number,
    max?: number,
}

/**
 * Validates a form-element to contain a valid number.
 * This will run for `input[type=number]` or can be forced for inputs with
 * `[data-validate=number-range]`.
 */
export const NumberRangeValidator: ValidatorInterface<NumberRangeValidationResult> = {
    getIdentifier: () => 'number-range',
    isApplicable: input => AbstractValidator.isApplicable(input)
        && (input.getAttribute('type') === 'number'
            || input.matches(`[data-validate~="${NumberRangeValidator.getIdentifier()}"]`)
        ),
    validate: input =>
        (onError, onSuccess) => {
            const val = input.value.trim();
            const numVal = Number(val);
            if (val === '' || Number.isNaN(numVal)) {
                onSuccess();
                return;
            }
            const min = input.getAttribute('min');
            const max = input.getAttribute('max');
            let minVal: number;
            let maxVal: number;
            const args: NumberRangeValidationResult = {};
            let valid = true;
            if (min !== null) {
                minVal = Number.parseInt(min);
                if (!Number.isNaN(minVal)) {
                    args.min = minVal;
                    if (numVal < minVal) {
                        valid = false;
                    }
                }
            }
            if (max !== null) {
                maxVal = Number.parseInt(max);
                if (!Number.isNaN(maxVal)) {
                    args.max = maxVal;
                    if (numVal > maxVal) {
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
            return translationLabels?.validationMessages['maxVal']?.(label, args.max) || `${label} needs to be less than ${args.max}`;
        }
        if (args.max === undefined) {
            return translationLabels?.validationMessages['minVal']?.(label, args.min) || `${label} needs to be greater than ${args.min}`;
        }
        if (args.max === args.min) {
            return translationLabels?.validationMessages['exactVal']?.(label, args.min) || `${label} needs to be ${args.min}`;
        }
        return translationLabels?.validationMessages['rangeVal']?.(label, args.min, args.max) || `${label} needs to be greater than ${args.min} and less than ${args.max}`;
    },
};

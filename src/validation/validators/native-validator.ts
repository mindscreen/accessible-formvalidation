import { ValidatorInterface, ValidationCallback } from './validator-interface';
import { AbstractValidator } from './abstract-validator';

type NativeValidationResult = ValidityState & { message: string };

/**
 * This validator evaluates the browser-validation on the given form element and
 * is thus always applicable.
 */
export const NativeValidator: ValidatorInterface<NativeValidationResult> = {
    getIdentifier: () => 'native',
    isApplicable: input => AbstractValidator.isApplicable(input)
        && input !== null,
    validate: (input): (
        onError: ValidationCallback<NativeValidationResult>,
        onSuccess: ValidationCallback<NativeValidationResult>
    ) => void => {
        return function (onError: ValidationCallback<NativeValidationResult>, onSuccess: ValidationCallback<NativeValidationResult>) {
            if (input.checkValidity()) {
                onSuccess();
            } else {
                onError({ ...input.validity, message: input.validationMessage });
            }
        };
    },
    getValidationMessage: (label: string, args: NativeValidationResult): string | null => {
        return `${label}: ${args.message}`;
    },
};

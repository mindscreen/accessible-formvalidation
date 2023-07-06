import { ValidatorInterface } from './validator-interface';
import { AbstractValidator } from './abstract-validator';

/**
 * Requires the evaluated input to contain a value.
 */
export const RequiredValidator: ValidatorInterface = {
    getIdentifier: () => 'required',
    isApplicable: input => AbstractValidator.isApplicable(input)
        && input.hasAttribute('required'),
    validate: input =>
        (onError, onSuccess) => {
            if (input.tagName.toLowerCase() === 'textarea' && input.value.trim().length === 0) {
                onError();
                return;
            }
            if (input.tagName.toLowerCase() === 'input') {
                switch (input.type) {
                    case 'text':
                    case 'number':
                    case 'email':
                    case 'tel':
                        if (!input.value.trim()) {
                            onError();
                            return;
                        }
                        break;
                    case 'checkbox':
                        if (!input.checked) {
                            onError();
                            return;
                        }
                        break;
                    case 'radio': {
                        const selector = `[name="${input.getAttribute('name')}"]`;
                        const checkedInputs = input.form.querySelector(`${selector}:checked`);
                        if (checkedInputs === null) {
                            onError();
                            return;
                        }
                        break;
                    }
                }
            }
            onSuccess();
        },
    getValidationMessage: (label, args, translationLabels) =>
        translationLabels?.validationMessages[RequiredValidator.getIdentifier()]?.(label) || `${label} is required`,
};

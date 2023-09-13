import { Validation, ValidationInstance, validationOptionsFromElement } from './validation';
import {
    EmailValidator,
    NumberValidator,
    NumberRangeValidator,
    PatternValidator,
    RequiredValidator,
    StringLengthValidator,
} from './validation/validators';

const defaultValidation = new Validation();
defaultValidation
    .registerValidator(RequiredValidator)
    .registerValidator(EmailValidator)
    .registerValidator(NumberValidator)
    .registerValidator(NumberRangeValidator)
    .registerValidator(StringLengthValidator)
    .registerValidator(PatternValidator);

/**
 * Helper function to easily set up validation with the {@link defaultValidation}
 * and options encoded in the HTML.
 * @param form The form to set up validation for
 * @returns A validation-instance for that form element
 * @throws {@link Error} if options could ne be initialized from environment
 */
export const initForForm = (form: HTMLFormElement): ValidationInstance => {
    const options = validationOptionsFromElement(form.querySelector('[data-validation-options]'));
    return defaultValidation.init(form, options);
};

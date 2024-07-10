import { InputElement, ValidationInstance } from '../validation-instance';
import { IErrorTranslations } from '../error-handler.types';

export type ValidationCallback<A> = (args?: A) => void;

/**
 * A validator.
 * Validators are supposed to validate a value that is empty or not set as valid
 * if is not explicitly required or expected otherwise.
 * @typeParam A The type of arguments that may be generated during validation.
 *      These arguments are later provided when generating an error-message and
 *      are intended to contain additional information on what led to the
 *      validation failing in order to create a helpful error-message.
 */
export interface ValidatorInterface<A = unknown> {
    /**
     * Identifies the validator.
     * Should match `/[a-z-_]+/`.
     *
     * @returns A identifier for this validator. Likely used to identify this
     *      validator when rendering error messages or in DOM attributes.
     */
    getIdentifier: () => string;
    /**
     * Determine whether this validator is at all applicable for a given form
     * element. Validation is skipped for this validator, if this function
     * returns false.
     *
     * @param input The input element to validate
     * @param validationInstance You may use the validationInstance to retrieve
     *      additional data.
     */
    isApplicable: (
        input: InputElement,
        validationInstance: ValidationInstance
    ) => boolean;
    /**
     * Runs a validation on a form element. Is expected to call the provided
     * callback after validation.
     *
     * @param input The input to validate
     * @param validationInstance The current validation-instance
     */
    validate: (
        input: InputElement,
        validationInstance: ValidationInstance
    ) => (
        onError: ValidationCallback<A>,
        onSuccess: ValidationCallback<A>
    ) => void;
    /**
     * Construct a validation-message a validation-error raised by this
     * validator.
     *
     * @param label The label to be used for the evaluated input element.
     * @param args Arguments generated in the {@link validate} method.
     * @param translationLabels Labels may get passed form the
     *      {@link ErrorHandlerInterface error-handler}. They may or may not
     *      contain labels for specific validations.
     *      @see {@link IErrorTranslations}
     * @returns The error message to display or `null` if no error message is
     *      to be displayed. This method is however mostly called if a
     *      validation-error was reported, so there is likely to always be an
     *      error-message to return.
     */
    getValidationMessage: (
        label: string,
        args: A,
        translationLabels: IErrorTranslations
    ) => string | null;
}

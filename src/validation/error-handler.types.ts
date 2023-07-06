import { IErrorInfo, ValidationInstance } from './validation-instance';
import { ValidatorInterface } from './validators';

/**
 * This structure is meant to replace arguments into a string
 * @param label The label of the form element
 * @param args Additional arguments
 */
type ErrorTranslator = (label: string, ...args: Array<string | number>) => string;

export interface IErrorTranslations {
    validationMessages: Record<string, ErrorTranslator>;
}

export interface IErrorHandlerBaseOptions {
    translations: IErrorTranslations;
}

/**
 * An error-handler manages how errors are brought to the DOM (or something more
 * abstract if necessary).
 * @typeParam O Options required by the actual error-handler implementation
 */
export interface ErrorHandlerInterface<O extends IErrorHandlerBaseOptions = IErrorHandlerBaseOptions> {
    /**
     * Called when the form gets submitted. Can be used to clear old state before
     * new errors are to be added.
     * @param form The form the validation ran for
     * @param result Whether the form was valid
     */
    handleSubmit?: (form: HTMLFormElement, result: boolean) => void;
    /**
     * Generates an error-message for the given validator.
     * Here you may use translation-strings that were given to the error-handler
     * in an options object.
     * @param validator The validator the error message should be generated for
     * @param inputLabel The label of the invalid input. This might already be
     *      a in some way evaluated label, i.e. based on additional attributes
     *      on the input.
     * @param args Arguments the validator returned when validating the input.
     *      If a validator returns such arguments, they are specified as generic
     *      on that validator. They may specify what invalidated the input, i.e.
     *      string-length bounds, so a more specific error message can be
     *      created.
     */
    getErrorMessage: (
        validator: ValidatorInterface,
        inputLabel: string,
        args?: unknown
    ) => string;
    /**
     * Called to remove all validation errors from the UI
     * @param validationInstance You may want to access the form fields
     */
    clearErrors: (
        validationInstance: ValidationInstance
    ) => void;
    /**
     * Called to add an error to the UI
     * @param validationInstance Provides access to i.e. form or form element
     *      based on {@link IErrorInfo.inputGroup} in case the `error` does not
     *      know the input element, get label elements etc.
     * @param error
     */
    createError: (
        validationInstance: ValidationInstance,
        error: IErrorInfo
    ) => void;
    /**
     * Called to remove an error from the UI
     * @param validationInstance
     * @param error This error is not necessarily a "complete" error-info but
     *      rather only contains the information necessary to identify the
     *      validated element and validator-type to identify the error-messages
     *      that are to removed.
     */
    removeError: (
        validationInstance: ValidationInstance,
        error: IErrorInfo
    ) => void;
    /**
     * Can be implemented to enrich static server-side rendered validation
     * results
     * @param form
     */
    initializeSsrResults: (form: HTMLFormElement) => void;
}

import { IValidationInstanceOptions, ValidationInstance, ValidatorConfiguration } from './validation-instance';
import { ErrorHandlerInterface, IErrorHandlerBaseOptions } from './error-handler.types';
import { IErrorHandlerOptions } from './error-handler';
import { ValidatorInterface } from './validators';

/**
 * @typeParam V The options for the validation-instance.
 * @typeParam E The options for the error-handler
 */
export interface IValidationOptions<
    V extends IValidationInstanceOptions,
    E extends IErrorHandlerBaseOptions = IErrorHandlerOptions
> {
    /**
     * Options that get passed on when creating the validation-instance
     */
    validationInstanceOptions: V;
    /**
     * If necessary you can provide a fully custom error-handler pre-configured
     * with options.
     * In this case the {@link errorHandlerOptions} are ignored.
     */
    errorHandler?: ErrorHandlerInterface<E>;
    /**
     * Options used the instantiate the default error-handler
     * @see {@link ErrorHandler}
     */
    errorHandlerOptions?: E;
}

/**
 * A validation-context knows which validators are available in a certain
 * context.
 * It provides a way to create a {@link ValidationInstance} for a given form.
 * While a validation-instance is specific for one form, a validation-context
 * can be re-used when initializing validation for multiple forms.
 *
 * @typeParam O The options to pass when creating a validation-instance
 */
export interface IValidationContext<O> extends ValidatorConfiguration {
    /**
     * Register a new validator
     * @param validator
     * @param name Optionally a name for the validator. If not provided, the
     *      {@link ValidatorInterface.getIdentifier validator identifier} will
     *      be used.
     * @returns Returns a fluent interface
     */
    registerValidator(validator: ValidatorInterface, name?: string): IValidationContext<O>;

    /**
     * Initialize a validation-instance for the given form
     * @param form The form element the validation-instance is created for.
     * @param options Options possibly passed to the validation-instance or other
     *      objects (i.e. a {@link ErrorHandlerInterface error-handler}) created
     *      in the process.
     */
    init(form: HTMLFormElement, options: Partial<O>): ValidationInstance;

    /**
     * The currently registered validators
     */
    validators: Record<string, ValidatorInterface>;
}

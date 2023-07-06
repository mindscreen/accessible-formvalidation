import { IValidationInstanceOptions, ValidationInstance } from './validation-instance';
import { NativeValidator, ValidatorInterface } from './validators';
import { IErrorHandlerBaseOptions } from './error-handler.types';
import { createTranslationFunction, ErrorHandler, IErrorHandlerOptions } from './error-handler';
import { IValidationContext, IValidationOptions } from './validation.types';

/**
 * Tries to retrieve the options set via data-attribute.
 * These options are likely generated via the backend rendering-helper and this
 * function relies on a specific structure.
 * @example set up validation
 * ```
 * const options = validationOptionsFromElement(
 *      form.querySelector('[data-validation-options]')
 * );
 * const nv = new NativeValidation();
 * nv.init(form, options);
 * ```
 * @param element The element to read the options form. This is likely to be
 *      ``form.querySelector(`[${attributeName}]`)``.
 * @param attributeName The name of the (data-) attribute to retrieve the options
 *      from.
 * @returns A valid subset of options for the default validation context
 * @see {@link IValidationOptions}
 */
export const validationOptionsFromElement = (element: HTMLElement, attributeName = 'data-validation-options'):
    Partial<IValidationOptions<IValidationInstanceOptions, IErrorHandlerOptions>> =>
{
    if (!element) throw new Error('Cannot get validation options; element not available');
    const attributeValue = element.getAttribute(attributeName);
    if (!attributeValue) throw new Error(`Cannot get validation options; attribute ${attributeName} not set`);
    const decoded = JSON.parse(attributeValue) as Partial<IValidationOptions<IValidationInstanceOptions, IErrorHandlerOptions>>;
    if (!decoded) throw new Error('Cannot get validation options; error parsing');
    const result: Partial<IValidationOptions<IValidationInstanceOptions, IErrorHandlerOptions>> = { ...decoded };
    const validationMessageTemplates: Record<string, string> = decoded.errorHandlerOptions.translations.validationMessages as unknown as Record<string, string>;
    result.errorHandlerOptions = {
        ...result.errorHandlerOptions,
        translations: {
            ...result.errorHandlerOptions.translations,
            validationMessages: {
                required: createTranslationFunction(validationMessageTemplates.required, [ 'label' ]),
                email: createTranslationFunction(validationMessageTemplates.email, [ 'label' ]),
                number: createTranslationFunction(validationMessageTemplates.number, [ 'label' ]),
                pattern: createTranslationFunction(validationMessageTemplates.pattern, [ 'label' ]),
                maxLength: createTranslationFunction(validationMessageTemplates.maxLength, [ 'label', 'max' ]),
                minLength: createTranslationFunction(validationMessageTemplates.minLength, [ 'label', 'min' ]),
                exactLength: createTranslationFunction(validationMessageTemplates.exactLength, [ 'label', 'length' ]),
                rangeLength: createTranslationFunction(validationMessageTemplates.rangeLength, [ 'label', 'min', 'max' ]),
                maxVal: createTranslationFunction(validationMessageTemplates.maxVal, [ 'label', 'max' ]),
                minVal: createTranslationFunction(validationMessageTemplates.minVal, [ 'label', 'min' ]),
                exactVal: createTranslationFunction(validationMessageTemplates.exactVal, [ 'label', 'length' ]),
                rangeVal: createTranslationFunction(validationMessageTemplates.rangeVal, [ 'label', 'min', 'max' ]),
            },
        },
    };
    return result;
};

export class Validation<
    V extends IValidationInstanceOptions,
    E extends IErrorHandlerBaseOptions
> implements IValidationContext<IValidationOptions<V, E>> {
    private registeredValidators: Record<string, ValidatorInterface> = {};
    registerValidator<A = unknown>(validator: ValidatorInterface<A>, name?: string): Validation<V, E> {
        this.registeredValidators[name || validator.getIdentifier()] = validator;
        return this;
    }
    init(form: HTMLFormElement, options: Partial<IValidationOptions<V, E>>): ValidationInstance {
        options.errorHandlerOptions = options.errorHandlerOptions || { translations: {} } as E;
        const eh = options.errorHandler || new ErrorHandler(options.errorHandlerOptions);
        const vi = new ValidationInstance(form, this, options.validationInstanceOptions);
        vi.setErrorHandler(eh);
        eh.initializeSsrResults(form);
        return vi;
    }
    get validators(): Record<string, ValidatorInterface> {
        return this.registeredValidators;
    }
}

/**
 * This validation-context comes with the {@link NativeValidator} pre-registered.
 * It is aimed to work out-of-the-box leveraging the validation-behaviour of the
 * browser.
 */
export class NativeValidation<
    V extends IValidationInstanceOptions,
    E extends IErrorHandlerBaseOptions
> extends Validation<V, E> {
    constructor() {
        super();
        this.registerValidator(NativeValidator);
    }
}

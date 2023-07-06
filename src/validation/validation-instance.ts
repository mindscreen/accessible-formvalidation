import { ErrorHandlerInterface } from './error-handler.types';
import { ValidatorInterface } from './validators';

/**
 * A input-group usually is a container containing the actual input, a label
 * element for it and possibly description texts, the error-message etc.
 */
export type InputGroup = HTMLElement;

export type ValidatorConfiguration = {
    /**
     * The validators that are available and should be considered for validation
     */
    validators: Record<string, ValidatorInterface>,
};

/**
 * A callback to be executed by a validator upon validating an input
 * @param inputGroup The input group that was validated
 * @param validatorName The name/identifier of the validator
 * @param args Optional arguments specifying why the value failed the validation
 */
type ValidationResultCallback = (
    inputGroup: InputGroup,
    validatorName: string,
    args: Record<string, any> | null | undefined
) => void;

export interface IValidationInstanceOptions {
    /**
     * The query-selector to determining what a input-group is, i.e. the container with input and label
     */
    groupSelector?: string;
    /**
     * The query-selector to find the input in the input-group
     */
    inputSelector?: string;
    /**
     * The query-selector to find a label for a checkbox.
     * This allows for a distinction between labels for rendering a custom checkbox and the actual text
     */
    checkboxLabelSelector?: string;
    /**
     * Called if there was a validation-error while validating a single input
     */
    onValidationError?: ValidationResultCallback;
    /**
     * Called if a single input was validated successfully.
     */
    onValidationSuccess?: ValidationResultCallback;
    /**
     * Called before validation starts on submit
     */
    onClearValidationErrors?: () => void;
    /**
     * Callback executed after validation and before submitting the form
     * @param validationResult
     */
    onSubmit?: (validationResult: boolean) => void;
}

export interface IErrorInfo {
    /**
     * The input-group that was validated
     */
    inputGroup: InputGroup;
    /**
     * The actual input that was validated, if any
     */
    inputElement?: HTMLInputElement;
    /**
     * The identifier of the validator that raised this validation error
     */
    validatorType: string;
    /**
     * The message created for this validation error.
     * This message might already include the label identifying the input.
     */
    message: string;
}

const noop = (): void => {/* */};

export const defaultOptions: Required<IValidationInstanceOptions> = {
    groupSelector: '.form-element__container',
    inputSelector: '[name]',
    checkboxLabelSelector: '.form-element__label--checkbox',
    onValidationError: noop,
    onValidationSuccess: noop,
    onClearValidationErrors: noop,
    onSubmit: noop,
};

/**
 * A validation-instance is linked to one specific form.
 * It provides methods to {@link validate invokeValidation} or
 * {@link clearValidationErrors clear validation errors} for the respective form.
 * Additionally it provides access to the base form and all {@link InputGroup}s
 * found in this form.
 *
 * A validation-instance is created with (and ideally by) a {@link IValidationContext validation-context}.
 *
 * Usually a validation-instance gets a {@link ErrorHandlerInterface} implementation
 * that manages how errors appear in (or disappear from) the document.
 *
 * @see {@link IValidationContext}
 * @see {@link Validation}
 * @see {@link ErrorHandlerInterface}
 */
export class ValidationInstance {
    private readonly _form: HTMLFormElement;
    private _validation: ValidatorConfiguration;
    private _options: IValidationInstanceOptions;
    private _submitterInput: HTMLInputElement | null;
    private errorHandler?: ErrorHandlerInterface;

    constructor(form: HTMLFormElement, validation: ValidatorConfiguration, options: IValidationInstanceOptions) {
        this._form = form;
        this._validation = validation;
        this._options = {
            ...defaultOptions,
            ...options,
        };
        this.validate = this.validate.bind(this);
        this._validate = this._validate.bind(this);
        this._init = this._init.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this.getInput = this.getInput.bind(this);
        this._init();
    }
    get form(): HTMLFormElement {
        return this._form;
    }
    get inputGroups(): InputGroup[] {
        return (Array.from(this._form.querySelectorAll(this._options.groupSelector)) as HTMLElement[]).filter(group => this.getInput(group) !== null);
    }
    isMultiInputElement(input: HTMLInputElement | null): null | boolean {
        if (!input) {
            return null;
        }
        const sameNameInputs = input.form.querySelectorAll(`[name="${input.name}"]:not([type="hidden"])`);
        return sameNameInputs.length > 1;
    }
    getInput(inputGroup: InputGroup): HTMLInputElement {
        let input = inputGroup.querySelector(this._options.inputSelector);
        if (input && input.getAttribute('type') === 'hidden') {
            const sibling = input.nextElementSibling;
            // in some cases a framework produces a hidden input to ensure a
            // default value for a checkbox being submitted although the
            // checkbox itself is unchecked
            if (sibling && sibling.matches(this._options.inputSelector) && sibling.getAttribute('type') === 'checkbox') {
                input = sibling;
            } else {
                return null;
            }
        }
        return input as HTMLInputElement;
    }
    getLabel(inputGroup: InputGroup, input?: HTMLInputElement): string {
        let label: HTMLElement = inputGroup.querySelector('label');
        let validationLabel = label.getAttribute('data-validation-label')
            || inputGroup.getAttribute('data-validation-label');
        const inputElement = input || this.getInput(inputGroup);
        if (validationLabel === null) {
            let fieldset = inputGroup.querySelector('fieldset');
            if (fieldset) {
                const legend = fieldset.querySelector('legend');
                if (legend !== null) {
                    label = legend;
                }
            } else if (this.isMultiInputElement(inputElement)) {
                fieldset = inputGroup.closest('fieldset');
                if (fieldset !== null) {
                    const legend = fieldset.querySelector('legend');
                    if (legend !== null) {
                        label = legend;
                    }
                }
            }
            const checkboxLabel = label.querySelector(this._options.checkboxLabelSelector) as HTMLElement;
            if (checkboxLabel) {
                label = checkboxLabel;
            }
            validationLabel = label.innerText;
        }
        return validationLabel;
    }
    static getIdentifier(input: HTMLInputElement): string {
        let id = input.id;
        if (input.getAttribute('type') === 'radio') {
            id = id.split('-').slice(0, -1).join('-');
        }
        return id;
    }
    validate(inputGroups?: InputGroup[]): boolean {
        const inputs = inputGroups || this.inputGroups;
        return Array.from(inputs).reduce((p, group) => this._validate(group)() && p, true);
    }
    private _validate(inputGroup: InputGroup): () => boolean {
        return () => {
            const input = this.getInput(inputGroup);
            if (!input || input.hidden) {
                return true;
            }
            const inputLabel = this.getLabel(inputGroup, input);
            let valid = true;
            const validators = this._validation.validators;
            Object.keys(validators).forEach(validatorName => {
                const validator = validators[validatorName];
                const errorInfo: IErrorInfo = {
                    validatorType: validatorName,
                    inputGroup: inputGroup,
                    inputElement: input,
                    message: '',
                };
                if (validator.isApplicable(input, this)) {
                    validator.validate(input, this)(
                        args => {
                            valid = false;
                            errorInfo.message = this.errorHandler?.getErrorMessage(validator, inputLabel, args) || '';
                            this._options.onValidationError?.(inputGroup, validatorName, args);
                            this.errorHandler?.createError(this, errorInfo);
                        },
                        args => {
                            this._options.onValidationSuccess?.(inputGroup, validatorName, args);
                            this.errorHandler?.removeError(this, errorInfo);
                        }
                    );
                }
            });
            return valid;
        };
    }
    private _onSubmit(e: SubmitEvent) {
        e.preventDefault();
        if (e.submitter) {
            this._submitterInput = document.createElement('input');
            this._submitterInput.type = 'hidden';
            this._submitterInput.name = (e.submitter as HTMLInputElement).name || e.submitter.getAttribute('name');
            this._submitterInput.value = (e.submitter as HTMLInputElement).value || e.submitter.getAttribute('value');
            this._form.appendChild(this._submitterInput);
        }
        this.clearValidationErrors();
        const result = this.validate();
        this._options.onSubmit(result);
        this.errorHandler?.handleSubmit?.(this.form, result);
        if (result) {
            this._form.submit();
        }
        if (this._submitterInput) {
            this._submitterInput.remove();
        }
    }
    private _init() {
        Array.from(this.inputGroups).forEach(group => {
            const input = this.getInput(group);
            input.addEventListener('change', this._validate(group));
        });
        this._form.setAttribute('novalidate', '');
        this._form.addEventListener('submit', this._onSubmit);
    }

    clearValidationErrors(): void {
        this.errorHandler?.clearErrors(this);
        this._options.onClearValidationErrors;
    }

    setErrorHandler(eh: ErrorHandlerInterface): void {
        this.errorHandler = eh;
    }
}

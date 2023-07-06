import { ErrorHandlerInterface, IErrorHandlerBaseOptions } from './error-handler.types';
import { IErrorInfo, InputGroup, ValidationInstance } from './validation-instance';
import { deepMerge, insertPositional, replaceAll, setAttributes, wrapContents } from '../util';
import { ValidatorInterface } from './validators';

/**
 * Turns a string like `{{label}} text {{arg1}}` into a function accepting two
 * arguments, populating the template accordingly.
 * This is a utility to hydrate options serialized into the DOM.
 * @example
 * ```
 * const t = createTranslationFunction(
 *      '{{label}} should be longer than {{length}}',
 *      ['label', 'length']
 * );
 * t('input', '5'); // 'input should be longer than 5'
 * ```
 * @param source The template string
 * @param argumentNames The names of the arguments in the order they are expected
 *      to be passed to the translation function
 * @returns A translation function
 */
export const createTranslationFunction = (source: string, argumentNames: string[]):
    (...args: Array<string | number>) => string =>
{
    return (...args: Array<string | number>) => source
        ? argumentNames.reduce((c, argName, i) =>
            replaceAll(c as string, `{{${argName}}}`, (args[i] as string) || ''), source)
        : '';
};

interface IErrorHandlerLabels {
    errorListTitle: string;
}

interface IErrorHandlerClassNames {
    /**
     * The base-class used for the li-elements in the error-container.
     * Variants
     * * `--done` Added when a validation problem has been resolved
     */
    errorListItem: string;
    /**
     * The base-class used for the error-container above the form.
     * Variants
     * * `--form-submitted` This can be used to only show the container
     *      when there are validation errors after the form was tried to submit
     */
    errorListContainer: string,
    /**
     * The class for the heading within the error-container
     */
    errorListTitle: string;
    /**
     * The class for the `ul`-element in the error-container
     */
    errorList: string;
    /**
     * The class for the element generated to display the validation-message
     * alongside the form element/input-group.
     * This class is used to identify such elements as well.
     */
    errorNode: string,
    /**
     * Added to the {@link IErrorHandlerClassNames.errorNode errorNode} element.
     */
    errorDescription: string,
    /**
     * Base-class of the input-groups to generate the following variants:
     * * `--valid` added after validation if the associated input is valid
     * * `--error` added after validation if the associated input is invalid
     */
    inputGroup: string,
}

interface IRenderingOptions {
    classNames: IErrorHandlerClassNames,
    labels: IErrorHandlerLabels,
}

export interface IErrorHandlerOptions extends IErrorHandlerBaseOptions, IRenderingOptions {
    /**
     * CSS selectors that are passed to `querySelector` functions
     */
    selectors: {
        /**
         * The container for the error list before the form
         */
        errorContainer: string,
        /**
         * The data-attribute with a string where error-messages for an
         * input-group should be placed
         * @see {@link insertPositional}
         */
        validationPlacementAttribute: string,
    },
    /**
     * Used to return (and create if necessary) the list prepending the form
     * which will return the error nodes
     * @param container The container where the resulting list is to be searched
     *      or created in.
     * @param options The options containing labels and class-names
     * @returns As errors are list items, this function is expected to return
     *      the list-element as container for these error-messages
     */
    onRenderErrorList: (
        container: HTMLElement | null,
        options: IRenderingOptions
    ) => HTMLUListElement;
    /**
     * Called to create (or retrieve) the error-message for a specific validator
     * within an input-group.
     * When error messages are cleaned up, this function is called to retrieve
     * the error-message for the specified validator (if there is any).
     * In this case, the function is instructed to not `create` a new element.
     * @param error The error-container with information about input,
     *      input-group and validator
     * @param insertNode A callback to insert the the node, if `create` is `true`
     * @param options The options containing labels and class-names
     * @param create Whether to create the resulting element if it doesn't exist.
     * @returns Return the error-message for the given validator. If a new
     *      element was created in this function, this should be returned.
     *      If `create` is `false` and now matching element exists, `null` is
     *      to be returned.
     */
    onRenderErrorNode: (
        error: IErrorInfo,
        insertNode: (error: IErrorInfo, node: HTMLElement) => void,
        options: IRenderingOptions,
        create?: boolean
    ) => HTMLElement | null;
    /**
     * Generates the error-message text from some error information
     * @param error The information about the error
     */
    onErrorMessage?: (error: IErrorInfo) => string;
}

/**
 * @see {@link IErrorHandlerOptions.onRenderErrorList}
 */
const onRenderErrorList: IErrorHandlerOptions['onRenderErrorList'] = (container, options) => {
    if (container && container.children && container.children.length > 0) {
        return container.querySelector('ul');
    }
    const wrapper = document.createElement('div');
    wrapper.classList.add(options.classNames.errorListContainer);
    const heading = document.createElement('h2');
    heading.classList.add(options.classNames.errorListTitle);
    heading.setAttribute('tabindex', '-1');
    heading.innerText = options.labels.errorListTitle;
    wrapper.appendChild(heading);
    const list = document.createElement('ul');
    list.className = options.classNames.errorList;
    wrapper.appendChild(list);
    container.appendChild(wrapper);
    return list;
};

/**
 * @see {@link IErrorHandlerOptions.onRenderErrorNode}
 */
const onRenderErrorNode: IErrorHandlerOptions['onRenderErrorNode'] = (error, insertNode, options, create) => {
    const id = `${ValidationInstance.getIdentifier(error.inputElement)}_${error.validatorType}`;
    let node = document.getElementById(id);
    if (node === null && create) {
        node = document.createElement('span');
        node.id = id;
        node.classList.add(options.classNames.errorNode);
        insertNode(error, node);
    }
    return node;
};

const defaultOptions: IErrorHandlerOptions = {
    translations: {
        validationMessages: {},
    },
    selectors: {
        errorContainer: '.form-error-container',
        validationPlacementAttribute: 'data-validation-placement',
    },
    classNames: {
        errorListContainer: 'form-errors',
        errorListTitle: 'copy-h2',
        errorList: 'copy-list copy-list--ul',
        errorListItem: 'error-list__item',
        errorNode: 'form-element__error-message',
        errorDescription: 'help-block',
        inputGroup: 'form-element__container',
    },
    labels: {
        errorListTitle: 'Korrigieren Sie folgende Fehler im Formular:',
    },
    onRenderErrorList,
    onRenderErrorNode,
    onErrorMessage: error => error.message,
};

/**
 * Populates a list above the form that contains accessible links to each form
 * element to easily fix the validation errors.
 *
 * Glossary:
 * * `errorListContainer` The container before the form with a title and a list
 *      of errors
 * * `errorList` The list-element within the `errorListContainer`
 * * `errorHandle` The list-items within the `errorList` with each the error-
 *      message and a link to the respective form-element. One form-element may
 *      have multiple error-messages (and thus error-handles) for different
 *      validators.
 *      An error-handle is "ticked off" if the error is resolved.
 * * `errorNode` The node containing the error-message alongside the input-group
 */
export class ErrorHandler implements ErrorHandlerInterface<IErrorHandlerOptions> {
    private readonly options: IErrorHandlerOptions;

    constructor(options: Partial<IErrorHandlerOptions>) {
        this.options = deepMerge(defaultOptions, options) as IErrorHandlerOptions;
        this.getErrorContainer = this.getErrorContainer.bind(this);
        this.getErrorNodeIds = this.getErrorNodeIds.bind(this);
        this.getErrorMessage = this.getErrorMessage.bind(this);
        this.getErrorNodeContainer = this.getErrorNodeContainer.bind(this);
        this.insertErrorNode = this.insertErrorNode.bind(this);
        this.insertErrorHandle = this.insertErrorHandle.bind(this);
        this.setErrorHandle = this.setErrorHandle.bind(this);
        this.clearErrors = this.clearErrors.bind(this);
        this.createError = this.createError.bind(this);
        this.removeError = this.removeError.bind(this);
        this.removeErrorForGroup = this.removeErrorForGroup.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    /**
     * Retrieves the list that should include the error-messages preceding the
     * form.
     * @param form The current form element
     * @returns A list element
     * @private
     */
    private getErrorContainer(form: HTMLFormElement) {
        const container = form.querySelector(this.options.selectors.errorContainer);
        return this.options.onRenderErrorList(container as HTMLElement, this.options);
    }

    /**
     * Inserts an error message into the error-list preceding the form.
     * @param input The input element that the message relates to. This element
     *      will be targeted when clicking the link created here.
     * @param validatorType The validator-type influences the ID of the message:
     *      For each validator a separate error-message will be created and will
     *      thus be marked as "done" if the validation-error is resolved.
     * @param errorMessage If the message is `null`, the message will be marked
     *      as "done" and will no longer be reachable via keyboard.
     * @returns The list-item to be inserted into the error-list
     * @private
     */
    private setErrorHandle(input: HTMLInputElement, validatorType: string, errorMessage: string | null): HTMLLIElement {
        const elId = ValidationInstance.getIdentifier(input);
        const errorId = `error-list-${elId}_${validatorType}`;
        let a = document.getElementById(errorId);
        let li: HTMLLIElement;
        if (a === null) {
            li = document.createElement('li');
            li.classList.add(this.options.classNames.errorListItem);
            a = document.createElement('a');
            setAttributes(a, {
                id: errorId,
                href: `#${elId}`,
                tabindex: '0',
            });
            li.appendChild(a);
            a.addEventListener('click', e => {
                e.preventDefault();
                if (!(e.currentTarget as HTMLAnchorElement).parentElement.classList.contains(this.options.classNames.errorListItem + '--done')) {
                    input.focus();
                }
            });
            a.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!(e.currentTarget as HTMLAnchorElement).parentElement.classList.contains(this.options.classNames.errorListItem + '--done')) {
                        input.focus();
                    }
                }
            });
        } else {
            li = a.closest('li');
        }
        if (errorMessage !== null) {
            a.innerHTML = errorMessage;
            li.classList.remove(this.options.classNames.errorListItem + '--done');
            a.setAttribute('tabindex', '0');
        } else {
            li.classList.add(this.options.classNames.errorListItem + '--done');
            a.setAttribute('tabindex', '-1');
        }
        return li;
    }

    /**
     * Inserts the error-handle relative to the inputs' position among other
     * inputs.
     * We should not just append error handles as they get validated so that the
     * order of error messages always follows the order of form elements.
     * @param container The container for the error handles
     * @param errorHandle The node containing the error message which should be
     *      inserted into the container
     * @param input The input the error handle relates to
     * @private
     */
    private insertErrorHandle(container: HTMLElement, errorHandle: HTMLElement, input: HTMLInputElement): void {
        if (!errorHandle) {
            return;
        }
        let handle: HTMLAnchorElement | null = null;
        let entry: Element | null = null;
        let insertBefore = false;
        for (let i = 0; i < container.children.length; i++) {
            entry = container.children[i];
            handle = entry.querySelector('a');
            if (!handle) {
                continue;
            }
            const other = document.querySelector(handle.getAttribute('href'));
            if (!other) {
                continue;
            }
            if (input.compareDocumentPosition(other) === Node.DOCUMENT_POSITION_FOLLOWING) {
                insertBefore = true;
                break;
            }
        }
        if (insertBefore) {
            container.insertBefore(errorHandle, entry);
        } else {
            container.appendChild(errorHandle);
        }
    }

    /**
     * Inserts an error-message (probably) into the given input-group.
     * This method abstracts that for some input-groups (i.e. with multiple
     * input elements) the error-message is expected to be created in a
     * different place.
     * @param error The error info
     * @param node The node to be inserted
     * @private
     */
    private insertErrorNode(error: IErrorInfo, node: HTMLElement) {
        const validationPlacement = error.inputGroup
            .getAttribute(this.options.selectors.validationPlacementAttribute);
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'assertive');
        if (error.inputElement?.type === 'radio' && validationPlacement) {
            insertPositional(error.inputGroup, liveRegion, validationPlacement);
        } else {
            insertPositional(error.inputGroup, liveRegion, 'before .form-text, in this');
        }
        liveRegion.append(node);
    }

    /**
     * Returns the container where an inputGroup places it's errors, evaluating
     * `data-validation-placement` if set.
     * @param inputGroup
     * @private
     */
    private getErrorNodeContainer(inputGroup: InputGroup): HTMLElement {
        let errorNodePosition = inputGroup;
        if (inputGroup.hasAttribute(this.options.selectors.validationPlacementAttribute)) {
            const selector = inputGroup.getAttribute(this.options.selectors.validationPlacementAttribute)
                .split(',')[0]
                .split(' ')[1]
                .trim();
            const parent = inputGroup.closest(selector);
            if (parent) {
                errorNodePosition = parent.parentElement;
            }
        }
        return errorNodePosition;
    }

    /**
     * Returns the IDs of the error-nodes (within an input-group) to then be
     * set as `aria-describedby` on the input element.
     * @param inputGroup The input-group error-nodes are searched for in
     * @returns The (with whitespace) concatenated IDs
     * @private
     */
    private getErrorNodeIds(inputGroup: InputGroup): string {
        return Array.from(this.getErrorNodeContainer(inputGroup)
            .querySelectorAll('.' + this.options.classNames.errorNode)
        )
            .map(n => n.id)
            .filter(n => document.getElementById(n) !== null)
            .join(' ');
    }

    /**
     * Removes all error-messages related to a specific input-group and resets
     * classes marking the input-group as being validated with or without
     * validation errors.
     * @param inputGroup The input-group
     * @param input The input element
     * @private
     */
    private removeErrorForGroup(inputGroup: InputGroup, input: HTMLInputElement) {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        inputGroup.classList.remove(this.options.classNames.inputGroup + '--valid');
        inputGroup.classList.remove(this.options.classNames.inputGroup + '--error');
    }

    clearErrors(validationInstance: ValidationInstance): void {
        this.getErrorContainer(validationInstance.form).parentElement.remove();
        Array.from(validationInstance.inputGroups)
            .forEach(g => this.removeErrorForGroup(g, validationInstance.getInput(g)));
        Array.from(validationInstance.form.querySelectorAll('.' + this.options.classNames.errorNode))
            .forEach(c => c.remove());
    }

    handleSubmit(form: HTMLFormElement, result: boolean): void {
        const errorContainer = this.getErrorContainer(form).parentElement;
        if (result) {
            errorContainer.classList.remove(this.options.classNames.errorListContainer + '--form-submitted');
        } else {
            errorContainer.classList.add(this.options.classNames.errorListContainer + '--form-submitted');
            errorContainer.querySelector('h2').focus();
        }
    }

    createError(vi: ValidationInstance, error: IErrorInfo): void {
        const input = error.inputElement || vi.getInput(error.inputGroup);
        const errorContainer = this.getErrorContainer(vi.form);
        const message = this.options.onErrorMessage(error);
        const errorHandle = this.setErrorHandle(input, error.validatorType, message);
        this.insertErrorHandle(errorContainer, errorHandle, input);
        const errorNode = this.options.onRenderErrorNode(error, this.insertErrorNode, this.options, true);
        if (errorNode) {
            errorNode.classList.add(this.options.classNames.errorDescription);
            errorNode.innerText = message;
        }
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', this.getErrorNodeIds(error.inputGroup));
        error.inputGroup.classList.add(this.options.classNames.inputGroup + '--error');
    }

    removeError(vi: ValidationInstance, error: IErrorInfo): void {
        const input = vi.getInput(error.inputGroup);
        this.setErrorHandle(input, error.validatorType, null);
        const errorNode = this.options.onRenderErrorNode(error, this.insertErrorNode, this.options, false);
        if (errorNode) {
            if (errorNode.parentElement.getAttribute('aria-live') === 'assertive') {
                errorNode.parentElement.remove();
            }
            errorNode.remove();
        }
        const errorNodeIds = this.getErrorNodeIds(error.inputGroup);
        if (errorNodeIds.length > 0) {
            input.setAttribute('aria-describedby', errorNodeIds);
            error.inputGroup.classList.remove(this.options.classNames.inputGroup + '--valid');
        } else {
            this.removeErrorForGroup(error.inputGroup, input);
            error.inputGroup.classList.remove(this.options.classNames.inputGroup + '--error');
        }
    }

    getErrorMessage(validator: ValidatorInterface, inputLabel: string, args: unknown | undefined): string {
        return validator.getValidationMessage(inputLabel, args, this.options.translations);
    }

    initializeSsrResults(form: HTMLFormElement): void {
        if (form.getAttribute('data-submitted') !== 'true') {
            return;
        }
        const existingErrorMessages = form.querySelectorAll('.' + this.options.classNames.errorListItem);
        if (existingErrorMessages.length < 1) {
            return;
        }
        for (let i = 0; i < existingErrorMessages.length; i++) {
            const targetName = existingErrorMessages[i].getAttribute('data-input');
            const targetInputs = document.getElementsByName(targetName);
            for (let j = 0; j < targetInputs.length; j++) {
                if (targetInputs[j].id) {
                    const a = document.createElement('a');
                    a.href = `#${targetInputs[j].id}`;
                    a.addEventListener('click', e => {
                        e.preventDefault();
                        targetInputs[j].focus();
                    });
                    wrapContents(existingErrorMessages[i], a);
                    break;
                }
            }
        }
        const title = form.querySelector('.' + this.options.classNames.errorListTitle) as HTMLElement;
        if (title) {
            title.setAttribute('tabindex', '-1');
            title.focus();
        }
    }

}

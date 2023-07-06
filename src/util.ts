export const setAttributes = (el: HTMLElement, attributes: Record<string, string | boolean | null>): void => {
    Object.keys(attributes).forEach(attr => {
        const value = attributes[attr];
        if (value === null) {
            el.removeAttribute(attr);
        } else {
            let val = value;
            if (value === true) {
                val = 'true';
            } else if (value === false) {
                val = 'false';
            }
            el.setAttribute(attr, val.toString());
        }
    });
};

const isObject = (item: unknown): boolean =>
    !!item && typeof item === 'object' && !Array.isArray(item);

export const deepMerge = <T extends object = Record<string, unknown>>(base: T, other: T): T => {
    const result: Partial<T> = Object.assign({}, base);
    if (isObject(base) && isObject(other)) {
        Object.keys(other).forEach(key => {
            if (isObject(other[key])) {
                if (!(key in base)) {
                    Object.assign(result, { [key]: other[key] });
                } else {
                    result[key] = deepMerge(base[key], other[key]);
                }
            } else {
                Object.assign(result, { [key]: other[key] });
            }
        });
    }
    return result as T;
};

export enum PositionalOrder {
    Before = 'before',
    After = 'after',
    In = 'in',
}

/**
 * Insert a node according to a string like `before #element` or `after .selector`
 * on the closest parent or the first child node matching the selector.
 * @param entry The element where the node should be inserted.
 * @param node The node to be inserted
 * @param positionString
 */
export const insertPositional = (entry: HTMLElement, node: HTMLElement, positionString: string): void => {
    const positionStrings = positionString.split(',').map(p => p.trim());
    for (let i = 0; i < positionStrings.length; i++) {
        const [ order, selector ] = positionStrings[i].split(' ');
        let pivot: Element;
        if (selector === 'this') {
            pivot = entry;
        } else {
            pivot = entry.closest(selector);
            if (!pivot) {
                pivot = entry.querySelector(selector);
            }
        }
        if (!pivot) {
            continue;
        }
        switch (order) {
            case PositionalOrder.Before:
                pivot.parentNode.insertBefore(node, pivot);
                break;
            case PositionalOrder.After:
                pivot.parentNode.insertBefore(node, pivot.nextSibling);
                break;
            case PositionalOrder.In:
                pivot.appendChild(node);
                break;
        }
        break;
    }
};

/**
 * "polyfill" for new String.replaceAll method
 * @param input Subject to replacement
 * @param pattern Literal or regex-pattern to replace
 * @param substitution String to replace the pattern with
 */
export const replaceAll = (
    input: string,
    pattern: string | RegExp,
    substitution: string
): string => {
    if (Object.prototype.toString.call(pattern).toLowerCase() === '[object regexp]') {
        return input.replace(pattern, substitution);
    }
    return input.replace(new RegExp(pattern, 'g'), substitution);
};

/**
 * Wrap the contents of one element in another one
 * @example Wrap content in a link
 * ```js
 * const a = Object.assign(document.createElement('a'), {
 *     href: '...',
 * });
 * wrapContents(container, a);
 * ```
 * @param contentContainer The element containing the elements to be wrapped
 * @param wrapper A new element not previously part of the container
 */
export const wrapContents = (
    contentContainer: Element,
    wrapper: Element,
): void => {
    while (contentContainer.firstChild) {
        wrapper.appendChild(contentContainer.firstChild);
    }
    contentContainer.appendChild(wrapper);
};

import { InputElement } from '../validation-instance';

/**
 * As typescript does not work with static methods, we "inherit" behaviour from
 * this container-object.
 */
export const AbstractValidator = {
    isApplicable: (input: InputElement): boolean =>
        !input.hidden && input.offsetParent !== null,
};

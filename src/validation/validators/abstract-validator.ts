/**
 * As typescript does not work with static methods, we "inherit" behaviour from
 * this container-object.
 */
export const AbstractValidator = {
    isApplicable: (input: HTMLInputElement): boolean =>
        !input.hidden && input.offsetParent !== null,
};

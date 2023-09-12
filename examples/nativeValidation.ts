import { NativeValidation } from '../src/validation';

const form = document.querySelector('form');
if (!form) {
    throw new Error('No form');
}

// avoid submitting form for demo purposes
form.addEventListener('submit', e => {
    e.preventDefault();
});

const validation = new NativeValidation();
validation.init(form, {});

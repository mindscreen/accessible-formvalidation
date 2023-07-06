interface SubmitEvent extends Event {
    readonly submitter: HTMLElement;
}

// based on https://gist.github.com/nuxodin/3ae174f2a6a112df3ccad22459237a91
(function() {
    let lastBtn: HTMLInputElement|null = null;

    document.addEventListener('click', function(e){
        if (!(e instanceof Element) || !(e.target as Element).closest) return;
        lastBtn = (e.target as Element).closest('button, input[type=submit]');
    }, true);

    document.addEventListener('submit', function(e: SubmitEvent){
        if ('submitter' in e && (e as SubmitEvent).submitter)
            return;
        const candidates = [ document.activeElement, lastBtn ];

        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            if (!candidate) continue;
            if (!(candidate as HTMLInputElement).form) continue;
            if (!candidate.matches('button, input[type=button], input[type=image]')) continue;
            Object.defineProperty(e, 'submitter', {
                value: candidate,
                writable: false,
            });
            return;
        }

        Object.defineProperty(e, 'submitter', {
            value: (e.target as Element).querySelector('button, input[type=button], input[type=image]'),
            writable: false,
        });
    }, true);
})();

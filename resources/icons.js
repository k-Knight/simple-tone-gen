window.ResourceModule_Icons = {
    parseSVG(svgString) {
        const parser = new DOMParser();
        // Uses XML namespace parsing to guarantee cross-browser vector rendering compliance
        const doc = parser.parseFromString(svgString, "application/xml");
        const svgNode = doc.documentElement;

        return document.importNode(svgNode, true);
    },

    get reset() {
        return this.parseSVG(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 transition-transform active:rotate-180 duration-200">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
        `);
    },

    get remove() {
        return this.parseSVG(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `);
    },

    get add() {
        return this.parseSVG(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `);
    },

    get arrowUp() {
        return this.parseSVG(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        `);
    },

    get arrowDown() {
        return this.parseSVG(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `);
    },

    get arrowTop() {
        return this.parseSVG(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                <polyline points="17 11 12 6 7 11"></polyline>
                <polyline points="17 18 12 13 7 18"></polyline>
            </svg>
        `);
    },

    get arrowBottom() {
        return this.parseSVG(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                <polyline points="7 13 12 18 17 13"></polyline>
                <polyline points="7 6 12 11 17 11"></polyline>
            </svg>
        `);
    }
};

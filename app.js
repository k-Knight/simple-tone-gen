const audio = new window.AudioEngineModule.AudioEngine();

function h(type, props, ...children) {
    props = props || {};
    if (typeof type === 'function') return type(props, children);
    
    const isSVG = ['svg', 'path', 'line', 'polyline', 'rect', 'circle', 'polygon', 'g'].includes(type);
    const el = isSVG 
        ? document.createElementNS("http://www.w3.org/2000/svg", type)
        : document.createElement(type);
    
    Object.keys(props).forEach(k => {
        if (k.startsWith('on') && typeof props[k] === 'function') {
            el.addEventListener(k.toLowerCase().substring(2), props[k]);
        } else if (k === 'class') {
            if (isSVG) el.setAttribute('class', props[k]); else el.className = props[k];
        } else if (k === 'style' && typeof props[k] === 'object') {
            Object.assign(el.style, props[k]);
        } else if (k === 'innerHTML') {
            el.innerHTML = props[k];
        } else if (typeof props[k] === 'boolean') {
            if (props[k]) el.setAttribute(k, ''); else el.removeAttribute(k);
        } else {
            el.setAttribute(k, props[k]);
        }
    });

    children.flat(Infinity).forEach(c => {
        if (c === null || c === undefined) return;
        if (c instanceof Node) {
            el.appendChild(c);
        } else {
            if (isSVG && typeof c === 'string' && !c.trim()) return;
            el.appendChild(document.createTextNode(String(c)));
        }
    });
    
    return el;
}

window.html = htm.bind(h);

any(document).on('DOMContentLoaded', () => {
    window.AppState = window.AppStateModule.create(audio);
    window.AppState.init();
});

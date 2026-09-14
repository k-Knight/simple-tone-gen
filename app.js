const audio = new window.AudioEngineModule.AudioEngine();

function h(type, props, ...children) {
    props = props || {};
    if (!type || (typeof type === 'string' && !type.trim())) return null;
    if (typeof type === 'function') return type(props, children);
    
    const isSVG = ['svg', 'path', 'line', 'polyline', 'rect', 'circle', 'polygon', 'g'].includes(type);
    const el = isSVG 
        ? document.createElementNS("http://w3.org", type)
        : document.createElement(type);
    
    Object.keys(props).forEach(k => {
        if (k.startsWith('on') && typeof props[k] === 'function') {
            el.addEventListener(k.toLowerCase().substring(2), props[k]);
        } else if (k === 'class') {
            // Unify class management for SVG elements to force browser style recalculation
            if (isSVG) {
                el.setAttribute('class', props[k]);
            } else {
                el.className = props[k];
            }
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
        if (c === null || c === undefined || (typeof c === 'string' && !c.trim())) return;
        
        if (c instanceof Node) {
            el.appendChild(c);
        } 
        else if (typeof c === 'object' && c.type) {
            // Recursive compilation path
            const nestedChild = h(c.type, c.props, ...c.children);
            if (nestedChild) el.appendChild(nestedChild);
        } 
        else {
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

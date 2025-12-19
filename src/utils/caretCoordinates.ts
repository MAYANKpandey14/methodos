/**
 * properties that affect the position of the caret/cursor
 */
const properties = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'MozTabSize',
] as const;

export interface Coordinates {
    top: number;
    left: number;
    height: number;
}

export function getCaretCoordinates(element: HTMLTextAreaElement, position: number): Coordinates {
    // @ts-ignore
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) {
        throw new Error('getCaretCoordinates should only be called in a browser');
    }

    const debug = false;
    // @ts-ignore
    const div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);

    const style = div.style;
    const computed = window.getComputedStyle(element);

    style.whiteSpace = 'pre-wrap';
    if (element.nodeName !== 'INPUT')
        style.wordWrap = 'break-word';

    style.position = 'absolute';
    if (!debug)
        style.visibility = 'hidden';

    properties.forEach((prop) => {
        // @ts-ignore
        style[prop] = computed[prop];
    });

    if (isBrowser) {
        if (window.getComputedStyle(element).boxSizing === 'border-box') {
            style.width = `${parseInt(computed.width)}px`;
        } else {
            style.width = `${parseInt(computed.width) - parseInt(computed.paddingLeft) - parseInt(computed.paddingRight) - parseInt(computed.borderLeftWidth) - parseInt(computed.borderRightWidth)}px`
        }
    } else {
        style.width = computed.width;
    }

    style.overflow = 'hidden';

    div.textContent = element.value.substring(0, position);
    if (element.nodeName === 'INPUT')
        div.textContent = div.textContent.replace(/\s/g, '\u00a0');

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    const coordinates = {
        top: span.offsetTop + parseInt(computed['borderTopWidth']),
        left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
        height: parseInt(computed['lineHeight'])
    };

    if (debug) {
        span.style.backgroundColor = '#aaa';
    } else {
        document.body.removeChild(div);
    }

    return coordinates;
}

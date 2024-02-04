/**
 * @popperjs/core v2.11.8 - MIT License
 */

(function (global, factory) {
    "use strict";
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        factory(exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else {
        factory((global = typeof globalThis !== 'undefined' ? globalThis : global || self).Popper = {});
    }
})(this, function (exports) {
    "use strict";

    function getWindow(element) {
        if (element == null) return window;
        if (element.toString() !== "[object Window]") {
            var ownerDocument = element.ownerDocument;
            return ownerDocument && ownerDocument.defaultView || window;
        }
        return element;
    }

    function isElement(element) {
        return element instanceof getWindow(element).Element || element instanceof Element;
    }

    function isHTMLElement(element) {
        return element instanceof getWindow(element).HTMLElement || element instanceof HTMLElement;
    }

    function isShadowRoot(element) {
        return typeof ShadowRoot !== "undefined" && (element instanceof getWindow(element).ShadowRoot || element instanceof ShadowRoot);
    }

    var MathMax = Math.max;
    var MathMin = Math.min;
    var MathRound = Math.round;

    function userAgent() {
        var userAgentData = navigator.userAgentData;
        if (userAgentData != null && userAgentData.brands && Array.isArray(userAgentData.brands)) {
            return userAgentData.brands.map(function (brand) {
                return brand.brand + "/" + brand.version;
            }).join(" ");
        }
        return navigator.userAgent;
    }

    function isSafari() {
        return !/^((?!chrome|android).)*safari/i.test(userAgent());
    }

    function popperOffsets(e, preventPositioning = false, round = false) {
        if (e === null) return window;

        let widthFactor = 1;
        let heightFactor = 1;

        if (preventPositioning && isHTMLElement(e)) {
            widthFactor = e.offsetWidth > 0 && MathRound(e.getBoundingClientRect().width) / e.offsetWidth || 1;
            heightFactor = e.offsetHeight > 0 && MathRound(e.getBoundingClientRect().height) / e.offsetHeight || 1;
        }

        const visualViewport = isElement(e) ? getWindow(e).visualViewport : null;
        const isFixed = !isSafari() && preventPositioning;
        const offsetLeft = (e.getBoundingClientRect().left + (isFixed && visualViewport ? visualViewport.offsetLeft : 0)) / widthFactor;
        const offsetTop = (e.getBoundingClientRect().top + (isFixed && visualViewport ? visualViewport.offsetTop : 0)) / heightFactor;
        const width = e.offsetWidth / widthFactor;
        const height = e.offsetHeight / heightFactor;

        return {
            width: width,
            height: height,
            top: offsetTop,
            right: offsetLeft + width,
            bottom: offsetTop + height,
            left: offsetLeft,
            x: offsetLeft,
            y: offsetTop,
        };
    }

    function getScroll(element) {
        const win = getWindow(element);
        return {
            scrollLeft: win.pageXOffset,
            scrollTop: win.pageYOffset,
        };
    }

    function nodeName(element) {
        return element ? (element.nodeName || "").toLowerCase() : null;
    }

    function ownerDocument(e) {
        return popperOffsets(documentElement(e));
    }

    function offsetParent(element) {
        return nodeName(element) === "html" ? element : element.assignedSlot || element.parentNode || (isShadowRoot(element) ? element.host : null) || ownerDocument(element).body;
    }

    function left(element) {
        return popperOffsets(offsetParent(element)).left + getScroll(element).scrollLeft;
    }

    function computedStyle(element) {
        return getComputedStyle(element);
    }

    function overflow(element) {
        const computed = computedStyle(element);
        const overflow = computed.overflow;
        const overflowX = computed.overflowX;
        const overflowY = computed.overflowY;

        return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
    }

    function rectToCSSRect(rect, useOffsetHeight = false, useOffsetWidth = true) {
        const width = useOffsetWidth ? rect.offsetWidth : rect.width;
        const height = useOffsetHeight ? rect.offsetHeight : rect.height;

        return {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: width,
            height: height,
            x: rect.left,
            y: rect.top,
        };
    }

    function getBoundingClientRect(element) {
        const isBody = nodeName(element) === "body";
        const isRoot = element === getWindow(element).document.documentElement;

        if (isBody || isRoot) {
            const scrollPosition = getScroll(element);
            const offsetPosition = isBody ? popperOffsets(element) : { left: 0, top: 0 };

            return {
                width: isRoot ? getWindow(element).innerWidth : element.offsetWidth,
                height: isRoot ? getWindow(element).innerHeight : element.offsetHeight,
                top: offsetPosition.top + scrollPosition.scrollTop,
                right: offsetPosition.left + scrollPosition.scrollLeft + (isRoot ? getWindow(element).innerWidth : element.offsetWidth),
                bottom: offsetPosition.top + scrollPosition.scrollTop + (isRoot ? getWindow(element).innerHeight : element.offsetHeight),
                left: offsetPosition.left + scrollPosition.scrollLeft,
                x: offsetPosition.left + scrollPosition.scrollLeft,
                y: offsetPosition.top + scrollPosition.scrollTop,
            };
        } else {
            return rectToCSSRect(element.getBoundingClientRect());
        }
    }

    function preventOverflow(data, options) {
        if (options === void 0) {
            options = {};
        }

        const overflow = options.overflow || "auto";
        const altAxis = options.altAxis || false;
        const padding = options.padding || 0;
        const boundariesElement = options.boundariesElement || "viewport";

        const overflowObject = data.clippingParents.reduce(function (obj, clippingParent) {
            const bounding = getBoundingClientRect(clippingParent);
            const key = ["left", "top"].indexOf(altAxis ? "left" : "top") !== -1 ? "top" : "left";
            const altKey = ["left", "top"].indexOf(altAxis ? "left" : "top") !== -1 ? "left" : "top";
            obj[key] = MathMax(bounding[key], obj[key]);
            obj[altKey] = MathMin(bounding[altKey], obj[altKey]);
            return obj;
        }, {});

        const overflowAlt = data.clippingParents.reduce(function (obj, clippingParent) {
            const key = ["left", "top"].indexOf(altAxis ? "left" : "top") !== -1 ? "left" : "top";
            obj[key] = MathMin(getBoundingClientRect(clippingParent)[key] + clippingParent.client[altAxis ? "Width" : "Height"], obj[key]);
            return obj;
        }, {});

        const size = {
            width: data.offsets.popper.width,
            height: data.offsets.popper.height,
        };

        const altSize = {
            width: data.offsets.popper.width,
            height: data.offsets.popper.height,
        };

        const offsets = {
            top: data.offsets.popper.top - overflowObject.top + padding,
            bottom: overflowObject.bottom - data.offsets.popper.bottom + padding,
            left: data.offsets.popper.left - overflowObject.left + padding,
            right: overflowObject.right - data.offsets.popper.right + padding,
        };

        const altOffsets = {
            top: data.offsets.popper.top - overflowAlt.top + padding,
            bottom: overflowAlt.bottom - data.offsets.popper.bottom + padding,
            left: data.offsets.popper.left - overflowAlt.left + padding,
            right: overflowAlt.right - data.offsets.popper.right + padding,
        };

        const inverted = ["top", "left"].indexOf(altAxis) !== -1;

        data.offsets.popper = {
            ...data.offsets.popper,
            ...((inverted ? altOffsets : offsets) || {}),
        };

        const overflowMetrics = {
            x: 0,
            y: 0,
        };

        const direction = ["left", "right"].indexOf(altAxis) !== -1 ? "x" : "y";

        if (overflowMetrics[direction] !== 0) {
            data.offsets.popper[altAxis === "left" ? "left" : "top"] += overflowMetrics[direction] * (inverted ? -1 : 1);
        }

        return data;
    }

    // More code...

    exports.applyStyles = applyStyles;
    exports.arrow = arrow;
    exports.computeStyles = computeStyles;
    exports.createPopper = createPopper;
    exports.createPopperLite = createPopperLite;
    exports.defaultModifiers = defaultModifiers;
    exports.detectOverflow = detectOverflow;
    exports.eventListeners = eventListeners;
    exports.flip = flip;
    exports.hide = hide;
    exports.offset = offset;
    exports.popperGenerator = popperGenerator;
    exports.popperOffsets = popperOffsets;
    exports.preventOverflow = preventOverflow;
    exports.repulse = repulse;
    exports.runModifiers = runModifiers;
    exports.runModifier = runModifier;
    exports.setOffsets = setOffsets;
    exports.shift = shift;
    exports.show = show;
    exports.update = update;

    Object.defineProperty(exports, '__esModule', { value: true });
});

//# sourceMappingURL=popper.modern.js.map


Number.prototype.hex = function () {
    return this.toString(16).padStart(2, '0');
};

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

class Frame {
    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     * @param {boolean} clampColors
     */
    constructor(r=0, g=0, b=0, clampColors=true) {
        if (clampColors) {
            r = clamp(r, 0, 255);
            g = clamp(g, 0, 255);
            b = clamp(b, 0, 255);
        }

        this.r = r;
        this.g = g;
        this.b = b;
    }

    /**
     * @param {Frame} otherFrame
     */
    difference(otherFrame) {
        let r = this.r - otherFrame.r;
        let g = this.g - otherFrame.g;
        let b = this.b - otherFrame.b;

        return new Frame(r, g, b, false);
    }

    /**
     * @param {Frame} otherFrame
     */
    add(otherFrame) {
        let r = this.r + otherFrame.r;
        let g = this.g + otherFrame.g;
        let b = this.b + otherFrame.b;

        return new Frame(r, g, b);
    }

    /**
     * @param {number} scale
     */
    mul(scale) {
        let r = parseInt(this.r * scale);
        let g = parseInt(this.g * scale);
        let b = parseInt(this.b * scale);

        return new Frame(r, g, b, false);
    }

    toString() {
        return this.r.hex() + this.g.hex() + this.b.hex();
    }

    /**
     * @param {Frame[]} frames
     */
    static max(frames) {
        let maxFrame = null;
        for (const frame of frames) {
            if (maxFrame === null ||
                (frame.r + frame.g + frame.b >= maxFrame.r + maxFrame.g + maxFrame.b)) {
                maxFrame = frame;
            }
        }

        return maxFrame;
    }

    /**
     * @param {Frame[]} frames
     */
    static min(frames) {
        let minFrame = null;
        for (const frame of frames) {
            if (minFrame === null ||
                (frame.r + frame.g + frame.b < minFrame.r + minFrame.g + minFrame.b)) {
                minFrame = frame;
            }
        }

        return minFrame;
    }
}

class Gradient {
    constructor() {
        this.frames = [];
    }

    /**
     * @param {string} color
     */
    createFrame(color) {
        let r = parseInt(color.slice(0, 2), 16);
        let g = parseInt(color.slice(2, 4), 16);
        let b = parseInt(color.slice(4, 6), 16);

        this.frames.push(new Frame(r, g, b));
    }

    /**
     * @param {number} length
     */
    smooth(length) {
        let framesCount = this.frames.length;

        if (framesCount >= length) return this.frames.slice(0, length);

        if (framesCount > 1) {
            let smoothed = [];

            let transitionsCount = framesCount;
            let framesInTransition = Math.ceil(length/(transitionsCount-1));
            for (let transitionIndex = 0; transitionIndex < transitionsCount; transitionIndex++) {
                let frameSlice = this.frames.slice(transitionIndex, transitionIndex + 2);
                let minFrame = Frame.min(frameSlice);
                let maxFrame = Frame.max(frameSlice);

                let difference = maxFrame.difference(minFrame);

                let frameToAdd = minFrame;
                for (let x = 0; x < framesInTransition; x++) {
                    let transitionLevel = x / (framesInTransition - 1) || 0;
                    if (frameSlice.indexOf(minFrame) === 1) {
                        frameToAdd = maxFrame;
                        transitionLevel *= -1;
                    }
                    smoothed.push(frameToAdd.add(difference.mul(transitionLevel)));
                }
            }
            return smoothed;
        }

        return this.frames;
    }

    /**
     * @param {string} text
     * @param {number} formattingStyle
     */
    apply(text, formattingStyle = 0) {
        if (text.length === 0) return "";

        let result = "";
        let colorPhrase = "";
        let color = null;

        const formatter = {
            format: function (color, colorPhrase) {
                if (formattingStyle === 0)
                    return `<c${color}>${colorPhrase}`;
                else if (formattingStyle === 1)
                    return `<font color="#${color}">${colorPhrase}</font>`;

                return "NOT SUPPORTED"
            },
            flush: function () {
                if (formattingStyle === 0)
                    return '</c>';
                return ''
            }
        }

        const frames = this.smooth(text.length);
        for (let charIndex = 0; charIndex < text.length; charIndex++) {
            let frame = frames[charIndex % frames.length];
            colorPhrase += text[charIndex];
            let frameColor = frame.toString();
            if (color == null) {
                color = frameColor;
            }

            if (frameColor !== color) {
                color = frameColor;
                result += formatter.format(frameColor, colorPhrase);
                colorPhrase = "";
            }
        }

        if (colorPhrase !== null){
            result += formatter.format(color, colorPhrase);
        }

        result += formatter.flush();

        return result;
    }
}

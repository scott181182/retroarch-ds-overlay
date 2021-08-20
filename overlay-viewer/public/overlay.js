



class Rect
{
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    scale(x, y) {
        return new Rect(this.x * x, this.y * y, this.w * x, this.h * y);
    }

    toString() {
        return `${this.x},${this.y},${this.w},${this.h}`;
    }

    static parse(str) {
        return new Rect(...str.trim().split(",").map((s) => parseFloat(s)));
    }
}



const ConfigUtil = {
    /** @param {Record<string, boolean | number | string} obj */
    obj2cfg(obj) {
        return Object.entries(obj)
            .map(([key, value]) => `${key} = ${ConfigUtil.stringifyValue(value)}`)
            .join("\n");
    },
    /** @param {string|number|boolean} value */
    stringifyValue(value) {
        return typeof(value) === "string" ? `"${value}"` : `${value}`;
    },
    /** @param {string} src */
    cfg2obj(src) {
        /** @type {Record<string, boolean | number | string} */
        const obj = {  };
        const lines = src.split(/[\r\n]+/)
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith("#"));
        for(const line of lines) {
            // console.log(line);
            const [key, value] = line.split(/\s*=\s*/);
            obj[key] = ConfigUtil.parseValue(value);
        }
        return obj;
    },
    /** @param {string} valueString */
    parseValue(valueString) {
        valueString = valueString.trim();
        if(valueString === "true")  { return true; }
        if(valueString === "false") { return false; }
        if(/^\d+$/.test(valueString)) { return parseInt(valueString); }
        if(/^(\d+\.\d*|\.\d+)$/.test(valueString)) { return parseFloat(valueString); }
        if(valueString.startsWith("\"")) {
            return valueString.substring(1, valueString.length - 1);
        }
        console.warn(`Cannot parse overlay value: ${valueString}`);
        return null;
    }
}

class InputOverlay
{
    /**
     *
     * @param {Overlay[]} overlays
     * @param {string} [template]
     */
    constructor(overlays, template) {
        /** @type {Overlay[]} */
        this.overlays = overlays;

        if(template) {
        /** @type {string|undefined} */
            this.template = template;
        }
    }

    getOverlays()     { return this.overlays; }
    getOverlayCount() { return this.overlays.length; }
    getTemplate()     { return this.template; }

    /** @param {string|number} index */
    getOverlay(index) {
        if(typeof(index) === "number") { return this.overlays[index]; }
        else {
            return this.overlays.find((o) => o.name === index);
        }
    }
    /** @param {string} name */
    getOverlayIndex(name) {
        return this.overlays.findIndex((o) => o.name === name);
    }

    toConfig() {
        /** @type {Record<string, boolean | number | string} */
        let obj = { overlays: this.overlays.length };
        for(let i = 0; i < this.overlays.length; i++) {
            obj = { ...obj, ...this.overlays[i].toConfig(i) };
        }
        return ConfigUtil.obj2cfg(obj);
    }



    /**
     * @param {string} src
     * @param {string} [template]
     */
    static parse(src, template) {
        const obj = ConfigUtil.cfg2obj(src);

        const overlays = new Array(obj.overlays);
        for(let i = 0; i < obj.overlays; i++) {
            overlays[i] = Overlay.parse(obj, i);
        }
        return new InputOverlay(overlays, template);
    }
}




class Overlay
{
    static DEFAULTS = {
        aspectRatio: 1.0,
        blockXSeparation: false,
        blockYSeparation: false,
        imageRect: new Rect(0, 0, 1, 1),
        fullscreen: false,
        opacity: 0.7
    };

    /** @type {string|null} */
    image;
    /** @type {string|null} */
    name;

    /** @type {number|undefined} */
    aspectRatio;
    /** @type {boolean|undefined} */
    blockXSeparation;
    /** @type {boolean|undefined} */
    blockYSeparation;
    /** @type {Rect|undefined} */
    imageRect;
    /** @type {boolean|undefined} */
    fullscreen;

    /** @type {{normalized?: boolean, alphaMod?: number, rangeMod?: number}} */
    defaults = {
        normalized: undefined,
        alphaMod: undefined,
        rangeMod: undefined
    };


    constructor() {
        /** @type {OverlayDescriptor[]} */
        this.descriptors = [  ];
    }

    getValue(key) { return this[key] === undefined ? Overlay.defaults[key] : this[key]; }
    getAspectRatio() { return this.getValue("aspectRatio"); }
    getBlockXSeparation() { return this.getValue("blockXSeparation"); }
    getBlockYSeparation() { return this.getValue("blockYSeparation"); }
    getImageRect() { return this.getValue("imageRect"); }
    getFullscreen() { return this.getValue("fullscreen"); }

    toNormalized(width, height) {
        this.aspectRatio = width / height;
        this.defaults.normalized = true;
        for(const desc of this.descriptors) {
            desc.x  /= width;
            desc.y  /= height;
            desc.rx /= width;
            desc.ry /= height;
        }
    }
    toAbsolute(width, height) {
        this.aspectRatio = width / height;
        this.defaults.normalized = undefined;
        for(const desc of this.descriptors) {
            desc.x  = Math.round(desc.x * width);
            desc.y  = Math.round(desc.y * height);
            desc.rx = Math.round(desc.rx * width);
            desc.ry = Math.round(desc.ry * height);
        }
    }



    toConfig(index) {
        let obj = {  };

        if(this.name       !== undefined) { obj[`overlay${index}_name`]        = this.name; }
        if(this.image      !== undefined) { obj[`overlay${index}_overlay`]     = this.image; }
        if(this.imageRect  !== undefined) { obj[`overlay${index}_rect`]        = this.imageRect.toString(); }
        if(this.fullscreen !== undefined) { obj[`overlay${index}_full_screen`] = this.fullscreen; }

        if(this.aspectRatio      !== undefined) { obj[`overlay${index}_aspect_ratio`]       = this.aspectRatio; }
        if(this.blockXSeparation !== undefined) { obj[`overlay${index}_block_x_separation`] = this.blockXSeparation; }
        if(this.blockYSeparation !== undefined) { obj[`overlay${index}_block_y_separation`] = this.blockYSeparation; }

        if(this.defaults.normalized !== undefined) { obj[`overlay${index}_normalized`] = this.defaults.normalized; }
        if(this.defaults.alphaMod   !== undefined) { obj[`overlay${index}_alpha_mod`]  = this.defaults.alphaMod; }
        if(this.defaults.rangeMod   !== undefined) { obj[`overlay${index}_range_mod`]  = this.defaults.rangeMod; }

        obj[`overlay${index}_descs`] = this.descriptors.length;
        for(let i = 0; i < this.descriptors.length; i++) {
            obj = { ...obj, ...this.descriptors[i].toConfig(index, i) };
        }
        return obj;
    }



    /**
     * @param {Record<string, boolean|number|string>} obj
     * @param {number} index
     */
    static parse(obj, index) {
        const overlay = new Overlay();
        const has_attr = (key) => `overlay${index}_${key}` in obj;
        const get_attr = (key) => obj[`overlay${index}_${key}`];

        if(has_attr("name"))        { overlay.name       = get_attr("name");        }
        if(has_attr("full_screen")) { overlay.fullscreen = get_attr("full_screen"); }

        if(has_attr("overlay"))     { overlay.image      = get_attr("overlay");          }
        if(has_attr("rect"))        { overlay.imageRect  = Rect.parse(get_attr("rect")); }

        if(has_attr("aspect_ratio"))       { overlay.aspectRatio      = get_attr("aspect_ratio");       }
        if(has_attr("block_x_separation")) { overlay.blockXSeparation = get_attr("block_x_separation"); }
        if(has_attr("block_y_separation")) { overlay.blockYSeparation = get_attr("block_y_separation"); }

        if(has_attr("normalized")) { overlay.defaults.normalized = get_attr("normalized");  }
        if(has_attr("range_mod"))  { overlay.defaults.rangeMod   = get_attr("range_mod");   }
        if(has_attr("alpha_mod"))  { overlay.defaults.alphaMod   = get_attr("alpha_mod");   }

        const descCount = get_attr("descs");
        for(let i = 0; i < descCount; i++) {
            overlay.descriptors[i] = OverlayDescriptor.parse(obj, i, overlay, index);
        }

        return overlay;
    }
}
class OverlayDescriptor
{
    static DEFAULTS = {
        normalized: false,
        alphaMod: 1.0,
        rangeMod: 1.0,
        moveable: false
    }


    /** @type {number|undefined} */
    saturation;

    /** @type {string|undefined} */
    image;
    /** @type {boolean|undefined} */
    moveable;
    /** @type {string|undefined} */
    nextTarget;

    /** @type {boolean | undefined} */
    normalized;
    /** @type {number | undefined} */
    alphaMod;
    /** @type {number | undefined} */
    rangeMod;

    /**
     * @param {Overlay} overlay
     * @param {string} button
     * @param {number} x
     * @param {number} y
     * @param {"radial"|"rect"} hitbox
     * @param {number} rx
     * @param {number} ry
     */
    constructor(overlay, button, x, y, hitbox, rx, ry) {
        /** @type {Overlay} */
        this.overlay = overlay;

        /** @type {string} */
        this.button = button;
        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
        /** @type {"radial"|"rect"} */
        this.hitbox = hitbox;
        /** @type {number} */
        this.rx = rx;
        /** @type {number} */
        this.ry = ry;
    }

    getValue(key) {
        return this[key] !== undefined ? this[key]
             : this.overlay.defaults[key] !== undefined ? this.overlay.defaults[key]
             : OverlayDescriptor.DEFAULTS[key];
    }
    getNormalized() { return this.getValue("normalized"); }
    getAlphaMod()   { return this.getValue("alphaMod");   }
    getRangeMod()   { return this.getValue("rangeMod");   }
    getMoveable()   { return this.getValue("moveable"); }



    toConfig(parentIndex, index) {
        const obj = {  };
        obj[`overlay${parentIndex}_desc${index}`] = `${this.button},${this.x},${this.y},${this.hitbox},${this.rx},${this.ry}`;

        if(this.image      !== undefined) { obj[`overlay${parentIndex}_desc${index}_overlay`]     = this.image;      }
        if(this.moveable   !== undefined) { obj[`overlay${parentIndex}_desc${index}_moveable`]    = this.moveable;   }
        if(this.nextTarget !== undefined) { obj[`overlay${parentIndex}_desc${index}_next_target`] = this.nextTarget; }

        if(this.saturation !== undefined) { obj[`overlay${parentIndex}_desc${index}_pct`] = this.saturation; }

        if(this.normalized !== undefined) { obj[`overlay${parentIndex}_desc${index}_normalized`] = this.normalized; }
        if(this.alphaMod   !== undefined) { obj[`overlay${parentIndex}_desc${index}_alpha_mod`]  = this.alphaMod;   }
        if(this.rangeMod   !== undefined) { obj[`overlay${parentIndex}_desc${index}_range_mod`]  = this.rangeMod;   }

        return obj;
    }



    /**
     * @param {Record<string, boolean|number|string>} obj
     * @param {number} i
     * @param {Overlay} overlay
     * @param {number} parentIndex
     */
    static parse(obj, i, overlay, parentIndex) {
        const desc = OverlayDescriptor.parseDescriptor(obj[`overlay${parentIndex}_desc${i}`], overlay);
        const has_attr = (key) => `overlay${parentIndex}_desc${i}_${key}` in obj;
        const get_attr = (key) => obj[`overlay${parentIndex}_desc${i}_${key}`];

        if(has_attr("overlay"))     { desc.image      = get_attr("overlay");     }
        if(has_attr("next_target")) { desc.nextTarget = get_attr("next_target"); }

        if(has_attr("saturate_pct")) { desc.saturation = get_attr("saturate_pct"); }
        else if(has_attr("pct"))     { desc.saturation = get_attr("pct");          }

        if(has_attr("normalized"))   { desc.normalized = get_attr("normalized");   }
        if(has_attr("range_mod")) { desc.rangeMod = get_attr("range_mod"); }
        if(has_attr("alpha_mod")) { desc.alphaMod = get_attr("alpha_mod"); }

        return desc;
    }
    /**
     * @param {string} str
     * @param {Overlay} overlay
     */
    static parseDescriptor(str, overlay) {
        return new OverlayDescriptor(overlay, ...str.split(",").map((s, i) => [1,2,4,5].includes(i) ? parseFloat(s) : s));
    }
}

try {
    if(module && module.exports) {
        module.exports = {
            Rect,
            ConfigUtil,
            InputOverlay,
            Overlay,
            OverlayDescriptor
        };
    }
} catch(err) {
    if(err instanceof ReferenceError) {  }
    else { throw err; }
}

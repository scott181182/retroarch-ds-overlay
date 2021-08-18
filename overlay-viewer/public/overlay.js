


class OverlayConfig
{
    constructor(obj)
    {
        this.data = obj;
    }

    has(key) { return key in this.data; }
    get(key) { return this.data[key]; }
    set(key, value) { this.data[key] = value; }
    delete(key) { delete this.data[key]; }

    toOverlays(template) {
        /** @type {Overlay[] & { template: string }} */
        const overlays = new Array(this.data.overlays);
        for(let i = 0; i < this.data.overlays; i++) {
            overlays[i] = Overlay.parse(this.data, i);
        }
        overlays.template = template;
        return overlays;
    }
    merge(config) {
        this.data = { ...this.data, ...config.data };
    }


    
    static parse(src) {
        const obj = { overlays: 0 };
        const lines = src.split(/[\r\n]+/);
        for(const line of lines) {
            if(!line || line.startsWith("#")) { continue; }
            // console.log(line);
            const [key, value] = line.split(/\s*=\s*/);
            obj[key] = OverlayConfig.parseConfigValue(value);
        }
        return new OverlayConfig(obj);
    }

    static parseConfigValue(valueString) {
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



class Overlay
{
    static DEFAULT = new Overlay();


    constructor() {
        /** @type {string|null} */
        this.name = null;

        /** @type {number} */
        this.aspectRatio = 1.0;
        /** @type {boolean} */
        this.blockXSeparation = false;
        /** @type {boolean} */
        this.blockYSeparation = false;

        /** @type {string|null} */
        this.image = null;
        /** @type {Rect} */
        this.imageRect = new Rect(0, 0, 1, 1);
        /** @type {boolean} */
        this.fullscreen = false;
        /** @type {boolean} */
        this.normalized = false;
        /** @type {OverlayDescriptor[]} */
        this.descriptors = [  ];

        /** @type {number} */
        this.alphaMod = 1.0;
        /** @type {number} */
        this.rangeMod = 1.0;
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
        if(has_attr("normalized"))  { overlay.normalized = get_attr("normalized");  }

        if(has_attr("overlay"))     { overlay.image      = get_attr("overlay");          }
        if(has_attr("rect"))        { overlay.imageRect  = Rect.parse(get_attr("rect")); }

        if(has_attr("aspect_ratio"))       { overlay.aspectRatio      = get_attr("aspect_ratio");       }
        if(has_attr("block_x_separation")) { overlay.blockXSeparation = get_attr("block_x_separation"); }
        if(has_attr("block_y_separation")) { overlay.blockYSeparation = get_attr("block_y_separation"); }

        if(has_attr("range_mod")) { overlay.rangeMod = get_attr("range_mod"); }
        if(has_attr("alpha_mod")) { overlay.alphaMod = get_attr("alpha_mod"); }

        const descCount = get_attr("descs");
        for(let i = 0; i < descCount; i++) {
            overlay.descriptors[i] = OverlayDescriptor.parse(obj, i, overlay, index);
        }

        return overlay;
    }



    toConfig(index) {
        const config = new OverlayConfig({  });

        if(this.name !== Overlay.DEFAULT.name) { config.set(`overlay${index}_name`, this.name); }

        if(this.aspectRatio !== Overlay.DEFAULT.aspectRatio) { config.set(`overlay${index}_aspect_ratio`, this.aspectRatio); }
        if(this.blockXSeparation !== Overlay.DEFAULT.blockXSeparation) { config.set(`overlay${index}_block_x_separation`, this.blockXSeparation); }
        if(this.blockYSeparation !== Overlay.DEFAULT.blockYSeparation) { config.set(`overlay${index}_block_y_separation`, this.blockYSeparation); }

        if(this.image !== Overlay.DEFAULT.image) { config.set(`overlay${index}_overlay`, this.image); }
        if(this.imageRect !== Overlay.DEFAULT.imageRect) { config.set(`overlay${index}_rect`, this.imageRect); }
        if(this.fullscreen !== Overlay.DEFAULT.fullscreen) { config.set(`overlay${index}_full_screen`, this.fullscreen); }
        if(this.normalized !== Overlay.DEFAULT.normalized) { config.set(`overlay${index}_normalized`, this.normalized); }

        if(this.alphaMod !== Overlay.DEFAULT.alphaMod) { config.set(`overlay${index}_alpha_mod`, this.alphaMod); }
        if(this.rangeMod !== Overlay.DEFAULT.rangeMod) { config.set(`overlay${index}_range_mod`, this.rangeMod); }
        
        config.set(`overlay${index}_descs`, this.descriptors.length);
        for(let i = 0; i < this.descriptors.length; i++) {
            config.merge(this.descriptors[i].toConfig(this, index, i));
        }
    }
}
class OverlayDescriptor
{
    static DEFAULT = new OverlayDescriptor();

    /**
     * @param {string} button
     * @param {number} x
     * @param {number} y
     * @param {"radial"|"rect"} hitbox
     * @param {number} rx
     * @param {number} ry
     */
    constructor(button, x, y, hitbox, rx, ry) {
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

        /** @type {number|null} */
        this.saturation = null;

        /** @type {string|null} */
        this.image = null;
        /** @type {boolean} */
        this.moveable = false;
        /** @type {boolean} */
        this.normalized = false;

        /** @type {number} */
        this.alphaMod = 1.0;
        /** @type {number} */
        this.rangeMod = 1.0;
        /** @type {string|null} */
        this.nextTarget = null;
    }

    /**
     * @param {Record<string, boolean|number|string>} obj
     * @param {number} i
     * @param {Overlay}
     */
    static parse(obj, i, parent, parentIndex) {
        const desc = OverlayDescriptor.parseDescriptor(obj[`overlay${parentIndex}_desc${i}`], parent);
        const has_attr = (key) => `overlay${parentIndex}_desc${i}_${key}` in obj;
        const get_attr = (key) => obj[`overlay${parentIndex}_desc${i}_${key}`];

        if(has_attr("overlay"))     { desc.image      = get_attr("overlay");     }
        if(has_attr("next_target")) { desc.nextTarget = get_attr("next_target"); }

        if(has_attr("normalized"))   { desc.normalized = get_attr("normalized");   }
        if(has_attr("saturate_pct")) { desc.saturation = get_attr("saturate_pct"); }
        else if(has_attr("pct"))     { desc.saturation = get_attr("pct");          }

        if(has_attr("range_mod")) { desc.rangeMod = get_attr("range_mod"); }
        if(has_attr("alpha_mod")) { desc.alphaMod = get_attr("alpha_mod"); }

        return desc;
    }
    /**
     * @param {string} str
     * @param {Overlay} parent
     */
    static parseDescriptor(str, parent) {
        const desc = new OverlayDescriptor(...str.split(",").map((s, i) => [1,2,4,5].includes(i) ? parseFloat(s) : s));
        desc.normalized = parent.normalized;
        desc.alphaMod = parent.alphaMod;
        desc.rangeMod = parent.rangeMod;
        return desc;
    }


    toConfig(parent, parentIndex, index) {
        const config = new OverlayConfig({  });
        const hasImportantValue = (key) => this.saturation !== OverlayDescriptor.DEFAULT[key] && this.saturation !== parent[key]

        config.set(`overlay${parentIndex}_desc${index}`, `${this.button},${this.x},${this.y},${this.hitbox},${this.rx},${this.ry}`);

        if(hasImportantValue("saturation")) { config.set(`overlay${parentIndex}_desc${index}_pct`, this.saturation); }

        if(hasImportantValue("image")) { config.set(`overlay${parentIndex}_desc${index}_overlay`, this.image); }
        if(hasImportantValue("moveable")) { config.set(`overlay${parentIndex}_desc${index}_moveable`, this.moveable); }
        if(hasImportantValue("normalized")) { config.set(`overlay${parentIndex}_desc${index}_normalized`, this.normalized); }

        if(hasImportantValue("alphaMod")) { config.set(`overlay${parentIndex}_desc${index}_alpha_mod`, this.alphaMod); }
        if(hasImportantValue("rangeMod")) { config.set(`overlay${parentIndex}_desc${index}_range_mod`, this.rangeMod); }
        if(hasImportantValue("nextTarget")) { config.set(`overlay${parentIndex}_desc${index}_next_target`, this.nextTarget); }

        return config;
    }
}

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

    static parse(str) {
        return new Rect(...str.trim().split(",").map((s) => parseFloat(s)));
    }
}

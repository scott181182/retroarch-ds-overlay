

// class Overlays extends Array
// {

// }

class Overlay
{
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
}
class OverlayDescriptor
{
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
}

class Rect
{
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    static parse(str) {
        return new Rect(...str.trim().split(",").map((s) => parseFloat(s)));
    }
}

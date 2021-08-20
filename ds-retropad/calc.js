const fs = require("fs").promises;
const path = require("path");

const { InputOverlay, Overlay } = require("../overlay-viewer/public/overlay.js");



const DS_SCREEN_RATIO = 4 / 3;


const S8_WIDTH = 1440;
const S8_HEIGHT = 2960;
const PORTRAIT_RATIO  = S8_WIDTH  / S8_HEIGHT;
const LANDSCAPE_RATIO = S8_HEIGHT / S8_WIDTH;

const normalizeX = (x) => x / S8_WIDTH;
const normalizeY = (y) => y / S8_HEIGHT;
const normalizeDimension = ({ x, y }) => ({ x: normalizeX(x), y: normalizeY(y) });



/** @param {Overlay[]} overlays */
function configurePortrait(overlays)
{
    const portraitOverlays = overlays.filter((o) => o.name && o.name.startsWith("portrait") && !o.name.endsWith("-hidden"));
    if(portraitOverlays.length === 0) { return; }

    // The bottom (normalized) coordinate of the DS screens
    const MAX_Y = normalizeY(2 * (S8_WIDTH / DS_SCREEN_RATIO));

    // Find offsets for DPAD and Letter Buttons
    const dpadOverlay = portraitOverlays.find((o) => o.descriptors.some((d) => d.button === "up"));
    const upDesc = dpadOverlay.descriptors.find((d) => d.button === "up" && d.hitbox === "rect");
    const dpadTop = upDesc.y - upDesc.ry;
    const yDelta = MAX_Y - dpadTop;

    for(const overlay of portraitOverlays) {

        for(let i = 0; i < overlay.descriptors.length; i++) {
            const desc = overlay.descriptors[i];

            // Remove extra L/R bumpers
            if(/^[lr][23]$/.test(desc.button)) {
                overlay.descriptors.splice(i--, 1);
                continue;
            }

            // Reposition elements below the DS Screen
            if(/^([abxy](\|[abxy])?|(up|down|left|right)(\|(up|down|left|right))?|menu_toggle|analog_left)$/.test(desc.button)) {
                desc.y += yDelta;
            }
        }
    }
}

async function configureOverlay(filename) {
    const filedata = await fs.readFile(filename, "utf8");
    const overlays = InputOverlay.parse(filedata);

    // console.log(overlays);
    configurePortrait(overlays);

    const newConfig = overlays.toConfig();
    // console.log(newConfig);
    await fs.writeFile(filename + ".new", newConfig.toString());
}
async function unnormalize(inputPath, outputPath) {
    const filedata = await fs.readFile(inputPath, "utf8");
    const overlays = InputOverlay.parse(filedata);

    const width = 2560;
    const height = 1440;

    for(const overlay of overlays.getOverlays()) {
        if(overlay.name.includes("landscape")) {
            overlay.toAbsolute(width, height);
        } else {
            overlay.toAbsolute(height, width);
        }
    }

    const newConfig = overlays.toConfig();
    await fs.writeFile(outputPath, newConfig.toString());
}
(async function main() {
    const neocfgpath = path.resolve(__dirname, "..", "neo-retropad", "neo-retropad.cfg");
    const abspath = path.resolve(__dirname, "..", "neo-retropad", "neo-retropad-abs.cfg");
    // configureOverlay(__dirname + "/ds-retropad.cfg");
    unnormalize(neocfgpath, abspath);
})();

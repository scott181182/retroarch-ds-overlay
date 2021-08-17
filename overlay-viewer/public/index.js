


// Editor Setup
const editor = ace.edit("config-source");
editor.setTheme("ace/theme/github");
editor.session.setMode("ace/mode/toml");

editor.on("change", () => compileOverlays(editor.getValue()));
let currentTemplate = undefined;
/** @type {Overlay[] & { template: string }} */
let overlays = [];
let activeOverlayIndex = -1;
/** @type {Overlay | null} */
let activeOverlay = null;


const templates = [ "neo-retropad" ];
document.getElementById("form-template").addEventListener("input", (ev) => {
    const value = ev.target.value;
    if(templates.includes(value)) {
        loadTemplate(value);
    } else {
        currentTemplate = undefined;
        // Empty editor
        editor.setValue("", 0);
    }
});

async function loadTemplate(name) {
    const res = await fetch(`/api/${name}/${name}.cfg`);
    const cfg = await res.text();
    currentTemplate = name;
    editor.setValue(cfg, 0);
}

function parseOverlay(src) {
    const obj = { overlays: 0 };
    const lines = src.split(/[\r\n]+/);
    for(const line of lines) {
        if(!line || line.startsWith("#")) { continue; }
        // console.log(line);
        const [key, value] = line.split(/\s*=\s*/);
        obj[key] = parseOverlayValue(value);
    }
    return obj;
}
function parseOverlayValue(src) {
    src = src.trim();
    if(src === "true")  { return true; }
    if(src === "false") { return false; }
    if(/^\d+$/.test(src)) { return parseInt(src); }
    if(/^(\d+\.\d*|\.\d+)$/.test(src)) { return parseFloat(src); }
    if(src.startsWith("\"")) {
        return src.substring(1, src.length - 1);
    }
    console.warn(`Cannot parse overlay value: ${src}`);
    return null;
}
function compileOverlays(src) {
    const obj = parseOverlay(src);

    /** @type {Overlay[] & { template: string }} */
    overlays = new Array(obj.overlays);
    for(let i = 0; i < obj.overlays; i++) {
        overlays[i] = Overlay.parse(obj, i);
    }
    overlays.template = currentTemplate;
    console.log(overlays);

    activeOverlayIndex = 0;
    activeOverlay = overlays[activeOverlayIndex];
    renderActiveOverlay();
}



const overlay2screen = (coord) => ({
    x: coord.x * document.getElementById("overlay-canvas").clientWidth,
    y: coord.y * document.getElementById("overlay-canvas").clientHeight
});

function renderActiveOverlay()
{
    const canvas = document.getElementById("overlay-canvas");
    canvas.innerHTML = "";
    if(!activeOverlay) { return; }

    canvas.style.height = `${canvas.clientWidth / activeOverlay.aspectRatio}px`;

    // TODO: handle overlay properties.
    if(activeOverlay.image) {
        const img = document.createElement("img");
        img.src = `/api/${currentTemplate}/${activeOverlay.image}`;
        img.style.position = "absolute";
        const imgRect = activeOverlay.imageRect.scale(canvas.clientWidth, canvas.clientHeight);
        img.style.left   = `${imgRect.x}px`;
        img.style.top    = `${imgRect.y}px`;
        img.style.width  = `${imgRect.width}px`;
        img.style.height = `${imgRect.height}px`;
        canvas.appendChild(img);
    }

    for(let i = 0; i < activeOverlay.descriptors.length; i++) {
        const desc = activeOverlay.descriptors[i];

        const div = document.createElement("div");
        div.style.position = "absolute";
        const center = overlay2screen({ x: desc.x, y: desc.y });
        const range = overlay2screen({ x: desc.rx, y: desc.ry });
        div.style.left   = `${center.x - range.x}px`;
        div.style.top    = `${center.y - range.y}px`;
        div.style.width  = `${range.x * 2}px`;
        div.style.height = `${range.y * 2}px`;

        if(desc.image) {
            const img = document.createElement("img");
            img.src = `/api/${currentTemplate}/${desc.image}`;
            img.style.width  = "100%";
            img.style.height = "100%";
            div.appendChild(img);
        }

        if(desc.nextTarget) {
            div.onclick = (_ev) => {
                console.log(`Next Layout: ${desc.nextTarget}`);
                activeOverlayIndex = overlays.findIndex((ov) => ov.name === desc.nextTarget);
                if(activeOverlayIndex < 0) {
                    console.error(`Cannot find overlay for '${desc.nextTarget}'`);
                    return;
                }
                activeOverlay = overlays[activeOverlayIndex];
                renderActiveOverlay();
            };
        } else {
            div.onclick = (_ev) => {
                console.log(`Button: ${desc.button}`);
            };
        }

        div.className = "descriptor"
        div.id = `overlay0_desc${i}`;

        canvas.appendChild(div);
    }
}




// Editor Setup
const editor = ace.edit("config-source");
editor.setTheme("ace/theme/github");
editor.session.setMode("ace/mode/toml");

editor.on("change", renderOverlays);
let currentTemplate = "";
let overlays = [];
let activeOverlayIndex = -1;
let activeOverlay = undefined;


const templates = [ "neo-retropad" ];
document.getElementById("form-template").addEventListener("input", (ev) => {
    const value = ev.target.value;
    if(templates.includes(value)) {
        loadTemplate(value);
    } else {
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
    const obj = {  };
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
function compileOverlay(src) {
    const obj = parseOverlay(src);

    /** @type {Overlay[] & { template: string }} */
    const overlays = new Array(obj.overlays);
    for(let i = 0; i < obj.overlays; i++) {
        overlays[i] = Overlay.parse(obj, i);
    }
    overlays.template = currentTemplate;

    return overlays;
}



const overlay2screen = (coord) => ({
    x: coord.x * document.getElementById("overlay-canvas").clientWidth,
    y: coord.y * document.getElementById("overlay-canvas").clientHeight
});

function renderOverlays() {
    overlays = compileOverlay(editor.getValue());
    console.log(overlays);

    if(overlays.length === 0) { return; }

    activeOverlayIndex = 0;
    activeOverlay = overlays[activeOverlayIndex];
    renderOverlay(activeOverlay);
}
/** @param {Overlay} overlay */
function renderOverlay(overlay)
{
    const canvas = document.getElementById("overlay-canvas");
    canvas.innerHTML = "";

    canvas.style.height = `${canvas.clientWidth / overlay.aspectRatio}px`;

    // TODO: handle overlay properties.
    if(overlay.image) {
        const img = document.createElement("img");
        img.src = `/api/${currentTemplate}/${overlay.image}`;
        img.style.position = "absolute";
        const imgRect = overlay.imageRect.scale(canvas.clientWidth, canvas.clientHeight);
        img.style.left   = `${imgRect.x}px`;
        img.style.top    = `${imgRect.y}px`;
        img.style.width  = `${imgRect.width}px`;
        img.style.height = `${imgRect.height}px`;
        canvas.appendChild(img);
    }

    for(let i = 0; i < overlay.descriptors.length; i++) {
        const desc = overlay.descriptors[i];

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

        div.className = "descriptor"
        div.id = `overlay0_desc${i}`;

        canvas.appendChild(div);
    }
}

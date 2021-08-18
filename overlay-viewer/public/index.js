


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


const templates = [ "neo-retropad", "ds-retropad" ];
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

document.getElementById("refresh-btn").addEventListener("click", () => {
    if(currentTemplate) {
        loadTemplate(currentTemplate);
    }
});





async function loadTemplate(name) {
    const res = await fetch(`/api/${name}/${name}.cfg`);
    const cfg = await res.text();
    currentTemplate = name;
    editor.setValue(cfg, 0);
}

function compileOverlays(src) {
    const config = OverlayConfig.parse(src);
    overlays = config.toOverlays(currentTemplate);
    console.log(overlays);

    if(activeOverlayIndex < 0 || activeOverlayIndex >= overlays.length) {
        activeOverlayIndex = 0;
    }
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
    appendDSBoxes(canvas);

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

        if(desc.hitbox === "radial") {
            div.style.borderRadius = "50%";
        }

        if(desc.image) {
            const img = document.createElement("img");
            img.src = `/api/${currentTemplate}/${desc.image}`;
            img.style.width  = "100%";
            img.style.height = "100%";
            div.appendChild(img);
        }

        div.addEventListener("click", (ev) => {
            // if(desc.hitbox === "rect") { ev.stopPropagation(); }
            // else if(desc.hitbox === "radial") {
            //     // Check if click was in radius
            //     const mx = ev.layerX - range.x;
            //     const my = ev.layerY - range.y;
            //     const d2 = Math.pow(mx / range.x, 2) + Math.pow(my / range.y, 2);
            //     console.log(mx, my, d2);
            //     if(d2 <= 1) { ev.stopPropagation(); }
            //     else { return; }
            // }

            if(desc.nextTarget) { switchOverlay(desc.nextTarget); }
            else { console.log(`Button: ${desc.button}`); }
        });

        div.className = "descriptor"
        div.id = `overlay0_desc${i}`;

        canvas.appendChild(div);
    }
}
function switchOverlay(name) {
    console.log(`Next Layout: ${name}`);
    activeOverlayIndex = overlays.findIndex((ov) => ov.name === name);
    if(activeOverlayIndex < 0) {
        console.error(`Cannot find overlay for '${name}'`);
        return;
    }
    activeOverlay = overlays[activeOverlayIndex];
    renderActiveOverlay();
}

const DS_ASPECT_RATIO = 4/3;
/** @param {HTMLDivElement} canvas */
function appendDSBoxes(canvas) {
    const topDiv = document.createElement("div");
    topDiv.className = "ds-screen ds-screen-top";
    topDiv.style.position = "absolute";
    const botDiv = document.createElement("div");
    botDiv.className = "ds-screen ds-screen-bottom";
    botDiv.style.position = "absolute";

    let width, height;
    if(canvas.clientWidth < canvas.clientHeight) {
        width = canvas.clientWidth;
        height = width / DS_ASPECT_RATIO;
        
        topDiv.style.left = "0";
        botDiv.style.left = "0";
    } else {
        height = canvas.clientHeight / 2;
        width = height * DS_ASPECT_RATIO;
        
        topDiv.style.left = `${(canvas.clientWidth - width) / 2}px`;
        botDiv.style.left = `${(canvas.clientWidth - width) / 2}px`;
    }
    
    topDiv.style.top = "0";
    topDiv.style.width  = `${width}px`;
    topDiv.style.height = `${height}px`;
    botDiv.style.top    = `${height}px`;
    botDiv.style.width  = `${width}px`;
    botDiv.style.height = `${height}px`;

    canvas.appendChild(topDiv);
    canvas.appendChild(botDiv);
}
var colors = [ "#131313","#1b1b1b","#272727","#3d3d3d","#5d5d5d","#858585","#b4b4b4","#ffffff","#c7cfdd","#92a1b9","#657392","#424c6e","#2a2f4e","#1a1932","#391f21","#5d2c28","#8a4836","#bf6f4a","#e69c69","#f6ca9f","#f9e6cf","#edab50","#e07438","#c64524","#8e251d","#ff5000","#ed7614","#ffa214","#ffc825","#ffeb57","#d3fc7e","#99e65f","#5ac54f","#33984b","#1e6f50","#134c4c","#0c2e44","#00396d","#0069aa","#0098dc","#00cdf9","#0cf1ff","#94fdff","#fdd2ed","#f389f5","#db3ffd","#7a09fa","#3003d9","#0c0293","#03193f","#3b1443","#622461","#93388f","#ca52c9","#c85086","#f68187","#f5555d","#ea323c","#c42430","#891e2b","#571c27","#ff0000","#00ff00","#0000ff" ];
var currentColor = "rgb(0,0,0)"; 
var backgroundColor = "rgb(255,255,255)";
var painting = false;
var erasing = false;
var currentBrush = 0;           // brush 0 - 2
var undoArray = [];             // Array to hold undo Object groups
var scale = 1;                  // Output scale
var alphaBackground = 1;        // Aplha setting of the background

var width = 70;                 // number of pixels on the canvas
var height = 70;                // number of pixels on the canvas
var pixelSize = .70;            // in vh

createCanvas(width, height);

document.body.onmousedown = function(){ painting = true; }
document.body.onmouseup   = function(){ painting = false; }

function createCanvas(width, height){
    let main          = createElement({tagName: "div",    id: "main"});
    let sideBar       = createElement({tagName: "sideBar", id: "sideBar"});
    let canvasHolder  = createElement({tagName: "div",    id: "canvasHolder"});
    let paintArea     = createElement({tagName: "div",    id: "paintArea", events: [{type: "mouseleave", fn: clearCursor}]});
    let alphaHolder   = createElement({tagName: "div",    id: "alphaHolder"});
    let scaleHolder   = createElement({tagName: "div",    id: "scaleHolder"});
    scaleHolder.appendChild(createElement({tagName: "input", id: "scaleSlider", type: "range", min: 1, max: 3, step: 1,   value: 1, events:[{type: "change", fn: scaleChange},{type: "input", fn:scaleChange}]}));
    alphaHolder.appendChild(createElement({tagName: "input", id: "alphaSlider", type: "range", min: 0, max: .99, step: .01, value: .99, events:[{type: "change", fn: alphaChange},{type: "input", fn:alphaChange}]}));
    scaleHolder.appendChild(createElement({tagName: "span",  id: "scaleText", innerText: "Output Scaling"}));
    alphaHolder.appendChild(createElement({tagName: "span",  id: "alphaText", innerText: "Background Alpha"}));

    sideBar.appendChild(createElement({tagName: "div",    id: "headerText", innerText: "Sprite Creator"}));
    canvasHolder.appendChild(createElement({tagName: "canvas", id: "myCanvas", width: scale*width, height: scale*height}));
    sideBar.appendChild(alphaHolder);
    sideBar.appendChild(scaleHolder);
    sideBar.appendChild(canvasHolder);
    sideBar.appendChild(createElement({tagName: "a", id: "saveButton", events:[{type: "click", fn: saveSprite}], innerText: "Download Sprite", classes: ["button"]}));
    sideBar.appendChild(createElement({tagName: "Label", id: "fileChooserLabel", innerText: "Import Sprite", classes: ["button"]}));
    sideBar.appendChild(createElement({tagName: "input", type: "file", name: "fileChooser", id: "fileChooser", accept: "image/png", events: [{type: "change", fn: handleFileSelect}], classes: ["button"]}));

    main.appendChild(paintArea);

    main.appendChild(sideBar);
    document.getElementsByTagName("body")[0].appendChild(main);
    document.getElementById("fileChooserLabel").setAttribute("for","fileChooser");
    
    createPixels();
    alphaChange();
    updateSprite();
    createPalette();
    setHeader();
}

function setHeader(){
    document.getElementById("headerText").innerText = `Sprite Creator\n(${width}X${height})`;
}

function createPixels(){

    let paintArea = document.getElementById("paintArea");
    while (paintArea.hasChildNodes()) {
        paintArea.removeChild(paintArea.lastChild);
    }

    for ( let h = 0; h < height; h++ ){
        let rowDiv = createElement({tagName: "div", id: "row"+h, classes: ["row"]});
        for ( let w = 0; w < width; w++ ){
            let pixelDiv = createElement({tagName: "div", id: w+","+h,  events: [{type: "click", fn: paintPixel}, {type: "mouseover", fn: mouseOver}], classes: ["pixel", "outlined", "background"]});
            pixelDiv.style.background = backgroundColor;    
            pixelDiv.style.width = pixelSize+'vw';
            pixelDiv.style.height = pixelSize+'vw',   
            rowDiv.appendChild(pixelDiv);
        }        
        document.getElementById("paintArea").appendChild(rowDiv);
    }

    setHeader();
}

function createPalette(){
    let paletteDiv = createElement( {tagName: "div", id: "paletteDiv"} );
    let paletteHolder = createElement( {tagName: "div", id: "paletteHolder"} );

    colors.forEach( (color, index) => {
        let colorDiv = createElement({tagName: "div", id: "color"+index, events: [{type: "click", fn: selectColor}], classes: ["colorDiv"]});
        colorDiv.style.backgroundColor = color;
        paletteHolder.appendChild(colorDiv);
    });

    paletteDiv.appendChild(paletteHolder);
    paletteDiv.appendChild(createElement({tagName:"button", id:"bgButton", events: [{type: "click", fn: setBackground}], innerText: "Set Background\nto Current Color"}));
    paletteDiv.appendChild(createElement({tagName:"img",    id:"eraser",   events: [{type: "click", fn: selectEraser}],  src: "eraser.png", classes: ["eraser","button"]}));
    document.getElementById("sideBar").appendChild(paletteDiv);
    document.getElementById("color0").classList.add("selected");
    createTools();
}


function createTools(){
    let toolboxDiv   = createElement({tagName: "div", id: "toolboxDiv"});
    let brushHolder  = createElement({tagName: "div", id: "brushHolder"});
    let buttonHolder = createElement({tagName: "div", id: "buttonHolder"});
    brushHolder.appendChild(createElement({tagName:  "button", id: "BrushButton0",  events: [{type: "click", fn: setBrush}],    innerText: "Small\nBrush",  classes: ["button","selected"]}));
    brushHolder.appendChild(createElement({tagName:  "button", id: "BrushButton1",  events: [{type: "click", fn: setBrush}],    innerText: "Medium\nBrush", classes: ["button"]}));
    brushHolder.appendChild(createElement({tagName:  "button", id: "BrushButton2",  events: [{type: "click", fn: setBrush}],    innerText: "Large\nBrush",  classes: ["button"]}));
    buttonHolder.appendChild(createElement({tagName: "button", id: "clearButton",   events: [{type: "click", fn: clearScreen}], innerText: "Clear\nScreen", classes: ["button"]}));
    buttonHolder.appendChild(createElement({tagName: "button", id: "unDoButton",    events: [{type: "click", fn: unDo}],        innerText: "UnDo\nLast",    classes: ["button"]}));
    buttonHolder.appendChild(createElement({tagName: "button", id: "unDoAllButton", events: [{type: "click", fn: unDoAll}],     innerText: "UnDo\nAll",     classes: ["button"]}));    
    toolboxDiv.appendChild(brushHolder);
    toolboxDiv.appendChild(buttonHolder);
    document.getElementById("paletteDiv").appendChild(toolboxDiv);
}

function alphaChange(event){
    alphaBackground = document.getElementById("alphaSlider").value;
    let alphaBackgroundColor = backgroundColor.replace(")", `,${alphaBackground})`);
    document.querySelectorAll("#paintArea .background").forEach(p => { p.style.backgroundColor = alphaBackgroundColor; } );
    updateSprite();
}

function scaleChange(event){
    scale = this.value;
    document.getElementById("canvasHolder").removeChild(document.getElementById("myCanvas"));
    document.getElementById("canvasHolder").appendChild(createElement({tagName: "canvas", id: "myCanvas", width: scale*width, height: scale*height}));
    updateSprite();
}

function selectColor(event){
    document.querySelectorAll("#paletteHolder .selected").forEach( element => { element.classList.remove("selected") } );
    this.classList.add("selected");
    currentColor = this.style.backgroundColor;
    document.getElementById("paletteDiv").classList.remove("eraseBorder");
    document.getElementById("paletteDiv").style.borderColor = this.style.backgroundColor;
    document.getElementById("eraser").classList.remove("selected");
    erasing = false;
    document.getElementById("bgButton").disabled = false;
}

function selectEraser(event){
    document.querySelectorAll("#paletteHolder .selected").forEach( element => {element.classList.remove("selected")} );
    this.classList.add("selected");
    erasing = true;
    document.getElementById("bgButton").disabled = true;
    document.getElementById("paletteDiv").style = "";
    document.getElementById("paletteDiv").classList.add("eraseBorder");
}

function clearScreen(event){ 
    let undoObj = {};
    document.querySelectorAll("#paintArea .painted").forEach( element => {         
        undoObj[element.id] = {color: element.style.backgroundColor, classes: element.classList.value.replace(" selected","")}; 
        element.style.backgroundColor = backgroundColor.replace(")", `,${alphaBackground})`);
        element.classList.remove("painted");
        element.classList.add("background");
    }); 
    undoArray.push(undoObj);
    updateSprite();
}

function paintPixel(event){ 
    applyColor(this); 
}

function mouseOver(event){
    displayCursor(this);
    if (painting){ 
        applyColor(this); 
    }
}

function applyColor(pixel){
    let neighbors = findNearNeighbors(pixel, currentBrush);
    updateUnDo(neighbors);
    neighbors.forEach( n => { 
        n.style.backgroundColor = erasing ? backgroundColor.replace(")",  `,${alphaBackground})` ) : currentColor;
        if (!erasing){
            n.classList.remove("background"); 
            n.classList.add("painted"); 
        }
        else{
            n.classList.remove("painted");
            n.classList.add("background");
        }
    });
    updateSprite();
}

function displayCursor(pixel){
    clearCursor();
    findNearNeighbors(pixel, currentBrush).forEach( pixel => {pixel.classList.add("selected");} );
} 

function clearCursor(){ 
    document.querySelectorAll("#paintArea .selected").forEach( pixel => {pixel.classList.remove("selected");} ); 
}

function updateUnDo(neighbors){
    let undoObj = {};
    neighbors.forEach( n => { undoObj[n.id] = {color: n.style.backgroundColor, classes: n.classList.value.replace(" selected", "")}; } );
    undoArray.push(undoObj);
}

function unDo(event){
    resetUnDoGroup(undoArray.pop());
    updateSprite();
}

function unDoAll(event){
    undoArray.reverse().forEach( undoElement => {resetUnDoGroup(undoElement);} ); 
    undoArray = [];
    updateSprite();
}

function resetUnDoGroup(group){
    for ( let key in group ){ 
        document.getElementById(key).style.background = group[key]["classes"].includes("background") ? backgroundColor.replace(")", `,${alphaBackground})` ) : group[key]["color"];
        document.getElementById(key).classList = group[key]["classes"]; 
    }
}

function setBrush(event){
    currentBrush = Number(this.id.replace("BrushButton",""));  
    document.querySelectorAll("#toolboxDiv .selected").forEach( brush => {brush.classList.remove("selected");} );
    this.classList.add("selected");
}

function setBackground(event){
    backgroundColor = currentColor;
    document.querySelectorAll("#paintArea .background").forEach( pixel => {pixel.style.backgroundColor = backgroundColor;} );
    alphaChange();
    updateSprite();
}

function findNearNeighbors(pixel, distance){
    let currentPixelX = Number(pixel.id.split(",")[0]);
    let currentPixelY = Number(pixel.id.split(",")[1]);
    let neighborList = [];
    if (distance === 0){
        return [pixel];
    }
    else{
        for ( let yDelta = -distance; yDelta <= distance; yDelta++ ){
            for ( let xDelta = -distance; xDelta <= distance; xDelta++ ){
                let possibleNeighbor = document.getElementById( `${currentPixelX + xDelta},${currentPixelY + yDelta}` );
                if (possibleNeighbor){ 
                    neighborList.push(possibleNeighbor); 
                }
            }
        }
    }
    return neighborList;
}

function updateSprite(){
    let canvas = document.getElementById("myCanvas");
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for ( let h = 0; h < height; h++ ){
        for ( let w = 0; w < width; w++ ){   
            ctx.fillStyle = document.getElementById( w + "," + h ).style.backgroundColor;
            ctx.fillRect(w * scale, h * scale, scale, scale); 
        }
    }
}

function saveSprite(event){
    let canvas = document.getElementById("myCanvas");
    this.href = canvas.toDataURL();
    this.download = "mypainting.png";
}

function handleFileSelect(event){
    var files = event.target.files;
    if(files.length === 0){ return; }
    var file = files[0];
    if(file.type !== '' && !file.type.match('image.*')){ return; }
    window.URL = window.URL || window.webkitURL;
    var imageURL = window.URL.createObjectURL(file);
    var img = new Image();   
    img.addEventListener('load', function() {
        document.getElementById("canvasHolder").removeChild(document.getElementById("myCanvas"));
        document.getElementById("canvasHolder").appendChild(createElement({tagName: "canvas", id: "myCanvas"}));
        var canvas = document.getElementById("myCanvas");
        canvas.width = img.width; 
        canvas.height = img.height;
        width = img.width;
        height = img.height;
        pixelSize = 49/height.toFixed(2); 
        createPixels();
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0);
        spriteToPixels();
    }, false);
    
    var fr = new FileReader();
    fr.onloadend = function(){ img.src = fr.result; }
    fr.readAsDataURL(file);    
}

function spriteToPixels(){
    var canvas = document.getElementById("myCanvas");
    let ctx = canvas.getContext("2d");
    alphaBackground = 1;

    for (let y = 0; y < canvas.height; y++){
        for (let x = 0; x < canvas.width; x++){
            let pixelData=ctx.getImageData(x,y,1,1);
            let red = pixelData.data[0];
            let green = pixelData.data[1];
            let blue = pixelData.data[2];
            let alpha = pixelData.data[3];
            let currentPixel = document.getElementById( `${x},${y}` );
            currentPixel.style.backgroundColor =  `rgba(${red}, ${green}, ${blue}, ${alpha})` ;
            currentPixel.classList.add("pixel");
            currentPixel.classList.add("outlined");
            if (alpha === 255){
                currentPixel.classList.remove("background"); 
                currentPixel.classList.add("painted"); 
            }
            else{
                currentPixel.classList.remove("painted");
                currentPixel.classList.add("background");
                alphaBackground = (alpha/255).toFixed(2); // ??? Is this right ???
            }
        }       
    }
    document.getElementById("alphaSlider").value = alphaBackground;
}

function circle (center,radius,step){
    let pixelArray = [];
    let x = Number(center.id.split(",")[0]);
    let y = Number(center.id.split(",")[1]);
                        
    for (let theta = 0; theta < Math.PI /2 +.1; theta+=step ) {
        let xPos = Math.round(radius * Math.cos(theta));
        let yPos = Math.round(radius * Math.sin(theta)); 
        let pixel = (x+ xPos) +","+ (y + yPos);
        if (!pixelArray.includes(pixel)){
            pixelArray.push(pixel);

            pixel = (x - xPos) +","+ (y + yPos);
            pixelArray.push(pixel);

            pixel = (x + xPos) +","+ (y - yPos);
            pixelArray.push(pixel);

            pixel = (x - xPos) +","+ (y - yPos);
            pixelArray.push(pixel);
        } 
    }
    return pixelArray;
}

function createElement(elementInfo){
    if (!elementInfo.tagName){
        console.log("ERROR: createElement was not sent a tag name!");
        return null;
    }
    let element = document.createElement(elementInfo.tagName);
    delete elementInfo.tagName;
    for ( let attribute in elementInfo ){
        switch (attribute){
            case "events": 
                elementInfo.events.forEach( e => { element.addEventListener(e.type, e.fn); });
            break;
            case "classes": 
                elementInfo.classes.forEach( c => { element.classList.add(c); });
            break;
            default: 
                element[attribute] = elementInfo[attribute];
            break;
        }
    }
    return element;
}

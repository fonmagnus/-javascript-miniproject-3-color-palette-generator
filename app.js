// * HSL coloring system
const HUE = 0;
const SAT = 1;
const BRIGHT = 2;

// * Global Selections and variabels
const colorDivs = document.querySelectorAll(".color");
const generateButton = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll(".color h2");
const popupContainer = document.querySelector(".copy-container");
const adjustButtons = document.querySelectorAll(".adjust");
const lockButtons = document.querySelectorAll(".lock");
const closeAdjustments = document.querySelectorAll(".close-adjustment");
const sliderContainers = document.querySelectorAll(".sliders");

// * Implement save to aplette and local storage
const saveButton = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".save-container");
const saveInput = document.querySelector(".save-container input");
const libraryContainer = document.querySelector(".library-container");
const libraryButton = document.querySelector(".library");
const closeLibraryButton = document.querySelector(".close-library");

let initialColors;
let savedPalettes = [];

// * Event Listeners

generateButton.addEventListener("click", randomColors);

sliders.forEach((slider) => {
  slider.addEventListener("input", hslControls);
});

colorDivs.forEach((slider, index) => {
  slider.addEventListener("change", () => {
    updateTextUI(index);
  });
});

currentHexes.forEach((hex) => {
  hex.addEventListener("click", () => {
    copyToClipboard(hex);
  });
});

popupContainer.addEventListener("transitionend", () => {
  const popupBox = popupContainer.children[0];
  popupContainer.classList.remove("active");
  popupBox.classList.remove("active");
});

adjustButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    toggleAdjustmentPanel(index);
  });
});

lockButtons.forEach((button, index) => {
  button.addEventListener("click", (e) => {
    lockLayer(e, index);
  });
});

closeAdjustments.forEach((button, index) => {
  button.addEventListener("click", () => {
    closeAdjustmentPanel(index);
  });
});

// Event Listeners
saveButton.addEventListener("click", openPalette);
closeSave.addEventListener("click", closePalette);
submitSave.addEventListener("click", savePalette);
libraryButton.addEventListener("click", openLibrary);
closeLibraryButton.addEventListener("click", closeLibrary);

// * Functions
// * Color generator

function generateHex() {
  const hexColor = chroma.random();
  return hexColor;
}

function randomColors() {
  // store our initial colors in array
  initialColors = [];
  colorDivs.forEach((div, index) => {
    // getting h2 text called "Hex" from each color card
    const hexText = div.children[0];
    const randomColor = generateHex();

    // Add the hex color to initialColors
    if (div.classList.contains("locked")) {
      initialColors.push(hexText.innerText);
      return;
    } else {
      initialColors.push(chroma(randomColor).hex());
    }

    // Add the color to the background
    div.style.backgroundColor = randomColor;
    // the color code that generates by random function is displayed
    hexText.innerText = randomColor;

    //check for contrast from text color to background color
    calibrateTextContrast(randomColor, hexText);

    // initialize colorize sliders
    const color = chroma(randomColor);
    const sliders = div.querySelectorAll(".sliders input");

    // selecting hue brightness saturation from slider input in each color
    const hueSlider = sliders[0];
    const brightnessSlider = sliders[1];
    const saturationSlider = sliders[2];

    colorizeSliders(color, hueSlider, brightnessSlider, saturationSlider);
  });

  // Reset input on slider value
  resetInputs();

  // Check contrast for button
  adjustButtons.forEach((adjustButton, index) => {
    lockButton = lockButtons[index];
    calibrateTextContrast(initialColors[index], adjustButton);
    calibrateTextContrast(initialColors[index], lockButton);
  });
}

function calibrateTextContrast(color, text) {
  // check how dark / light is the color
  const luminance = chroma(color).luminance();
  if (luminance > 0.5) {
    text.style.color = "black";
  } else {
    text.style.color = "white";
  }
}

function colorizeSliders(color, hueSlider, brightnessSlider, saturationSlider) {
  // * Manipulate slider for saturation
  // Scale saturation
  const noSaturation = color.set("hsl.s", 0);
  const fullSaturation = color.set("hsl.s", 1);

  // colorize saturation slider
  const scaleSaturation = chroma.scale([noSaturation, color, fullSaturation]);

  // Update input colors
  saturationSlider.style.backgroundImage = `linear-gradient(to right, ${scaleSaturation(
    0
  )}, ${scaleSaturation(1)}`;

  //------
  // * Manipulate brightness color
  const midBright = color.set("hsl.l", 0.5);
  const scaleBrightness = chroma.scale(["black", midBright, "white"]);
  brightnessSlider.style.backgroundImage = `linear-gradient(to right, ${scaleBrightness(
    0
  )}, ${scaleBrightness(0.5)}, ${scaleBrightness(1)})`;

  //------
  // * Manipulate brightness color
  hueSlider.style.backgroundImage =
    "linear-gradient(to right, rgb(204, 75, 75), rgb(204, 204, 75), rgb(75, 204, 75), rgb(75, 204, 204), rgb(75, 75, 204), rgb(204, 75, 204), rgb(204, 75, 75))";
}

function hslControls(e) {
  const index =
    e.target.getAttribute("data-bright") ||
    e.target.getAttribute("data-hue") ||
    e.target.getAttribute("data-sat");

  let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
  const hueSlider = sliders[0];
  const brightnessSlider = sliders[1];
  const saturationSlider = sliders[2];

  const bgColor = initialColors[index];
  let color = chroma(bgColor)
    .set("hsl.s", saturationSlider.value)
    .set("hsl.l", brightnessSlider.value)
    .set("hsl.h", hueSlider.value);

  colorDivs[index].style.backgroundColor = color;

  // Re-colorize sliders
  colorizeSliders(color, hueSlider, brightnessSlider, saturationSlider);
}

function updateTextUI(index) {
  const activeDiv = colorDivs[index];
  const color = chroma(activeDiv.style.backgroundColor);
  const textHex = activeDiv.querySelector("h2");
  const icons = activeDiv.querySelectorAll(".controls button");
  textHex.innerText = color.hex();

  // Check contrast
  calibrateTextContrast(color, textHex);
  for (icon of icons) {
    calibrateTextContrast(color, icon);
  }
}

function resetInputs() {
  const sliders = document.querySelectorAll(".sliders input");
  sliders.forEach((slider) => {
    if (slider.name === "hue") {
      // data-hue points an index for which color card
      const hueColor = initialColors[slider.getAttribute("data-hue")];
      const hueValue = chroma(hueColor).hsl()[HUE]; //0 represents hue
      slider.value = Math.floor(hueValue);
    } else if (slider.name === "brightness") {
      const brightnessColor = initialColors[slider.getAttribute("data-bright")];
      const brightnessValue = chroma(brightnessColor).hsl()[BRIGHT];
      slider.value = Math.floor(brightnessValue * 100) / 100;
    } else if (slider.name === "saturation") {
      const saturationColor = initialColors[slider.getAttribute("data-sat")];
      const saturationValue = chroma(saturationColor).hsl()[SAT];
      slider.value = Math.floor(saturationValue * 100) / 100;
    }
  });
}

function copyToClipboard(hex) {
  const el = document.createElement("textarea");
  el.value = hex.innerText;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);

  // Pop Up animation appear
  const popupBox = popupContainer.children[0];
  popupContainer.classList.add("active");
  popupBox.classList.add("active");
}

function toggleAdjustmentPanel(index) {
  sliderContainers[index].classList.toggle("active");
}

function lockLayer(e, index) {
  const lockSVG = e.target.children[0];
  const activeBg = colorDivs[index];
  activeBg.classList.toggle("locked");

  if (lockSVG.classList.contains("fa-lock-open")) {
    e.target.innerHTML = '<i class="fas fa-lock"></i>';
  } else {
    e.target.innerHTML = '<i class="fas fa-lock-open"></i>';
  }
}

function closeAdjustmentPanel(index) {
  sliderContainers[index].classList.remove("active");
}

function openPalette(e) {
  const popupSaveContainer = saveContainer.children[0];
  saveContainer.classList.add("active");
  popupSaveContainer.classList.add("active");
}

function closePalette(e) {
  const popupSaveContainer = saveContainer.children[0];
  saveContainer.classList.remove("active");
  popupSaveContainer.classList.remove("active");
}

function savePalette(e) {
  saveContainer.classList.remove("active");
  popupContainer.classList.remove("active");
  const name = saveInput.value;
  const colors = [];
  currentHexes.forEach((hex) => {
    colors.push(hex.innerText);
  });

  let paletteNr;
  const paletteInLocalStorage = JSON.parse(localStorage.getItem("palettes"));
  if (paletteInLocalStorage) {
    paletteNr = paletteInLocalStorage.length;
  } else {
    paletteNr = savedPalettes.length;
  }

  const paletteObj = { name, colors, nr: paletteNr };
  savedPalettes.push(paletteObj);

  // ? save to local storage
  saveToLocal(paletteObj);
  console.log(saveInput.value);
  saveInput.value = "";
  console.log(saveInput.value);

  // Generate the palette to library
  const palette = document.createElement("div");
  palette.classList.add("custom-palette");
  const title = document.createElement("h4");
  title.innerText = paletteObj.name;

  const preview = document.createElement("div");
  preview.classList.add("small-preview");
  paletteObj.colors.forEach((smallColor) => {
    const smallDiv = document.createElement("div");
    smallDiv.style.backgroundColor = smallColor;
    preview.appendChild(smallDiv);
  });

  const paletteButton = document.createElement("button");
  paletteButton.classList.add("pick-palette-btn");
  paletteButton.classList.add(paletteObj.nr);
  paletteButton.innerText = "Select";

  // Attach event to button
  paletteButton.addEventListener("click", (e) => {
    closeLibrary();
    const paletteIndex = e.target.classList[1];
    initialColors = [];
    savedPalettes[paletteIndex].colors.forEach((color, index) => {
      initialColors.push(color);
      colorDivs[index].style.backgroundColor = color;
      const text = colorDivs[index].children[0];
      calibrateTextContrast(color, text);
      updateTextUI(index);
    });
    resetInputs();
  });

  // Append to library
  palette.appendChild(title);
  palette.appendChild(preview);
  palette.appendChild(paletteButton);
  libraryContainer.children[0].appendChild(palette);
}

function getLocal() {
  let localPalettes;
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
  } else {
    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
    savedPalettes = [...paletteObjects];
    paletteObjects.forEach((paletteObj) => {
      const palette = document.createElement("div");
      palette.classList.add("custom-palette");
      const title = document.createElement("h4");
      title.innerText = paletteObj.name;

      const preview = document.createElement("div");
      preview.classList.add("small-preview");
      paletteObj.colors.forEach((smallColor) => {
        const smallDiv = document.createElement("div");
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
      });

      const paletteButton = document.createElement("button");
      paletteButton.classList.add("pick-palette-btn");
      paletteButton.classList.add(paletteObj.nr);
      paletteButton.innerText = "Select";

      // Attach event to button
      paletteButton.addEventListener("click", (e) => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        paletteObjects[paletteIndex].colors.forEach((color, index) => {
          initialColors.push(color);
          colorDivs[index].style.backgroundColor = color;
          const text = colorDivs[index].children[0];
          calibrateTextContrast(color, text);
          updateTextUI(index);
        });
        resetInputs();
      });

      // Append to library
      palette.appendChild(title);
      palette.appendChild(preview);
      palette.appendChild(paletteButton);
      libraryContainer.children[0].appendChild(palette);
    });
  }
}

function saveToLocal(paletteObj) {
  let localPalettes;
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
  } else {
    localPalettes = JSON.parse(localStorage.getItem("palettes"));
  }

  localPalettes.push(paletteObj);
  localStorage.setItem("palettes", JSON.stringify(localPalettes));
}

function openLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.add("active");
  popup.classList.add("active");
}

function closeLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.remove("active");
  popup.classList.remove("active");
}

// *** Run when javascript engine starts
function start() {
  getLocal();
  randomColors();
}

start();

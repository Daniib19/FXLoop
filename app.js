const context = new (window.AudioContext || window.webkitAudioContext)();

const FXType = {
  "amp" : Marshall,
  "cab" : Convolver,
  "od"  : Overdrive,
  "flg" : Flanger,
  "eq"  : EQ,
  "eq_mxr": EQ_MXR,
  "swc" : FXPatch,
  "vol" : VolumeFX,
  "gate": NoiseGate,
};

const FXNodes = {
  "Marshall": Marshall,
  "Convolver": Convolver,
  "Flanger": Flanger,
  "EQ": EQ,
  "EQ_MXR": EQ_MXR,
  "FXPatch": FXPatch,
  "Green_OD": Overdrive,
  "VolumeBoost": VolumeFX,
  "NoiseGate"  : NoiseGate
};

const audioList = {
  "Guitar Shred": "assets/audio/audio8.mp3",
  // "Enter Sandman": "assets/audio/audio5.wav",
  "Smells like Teen Spirit": "assets/audio/nirvana.mp3",
  // "Back in Black": "assets/audio/acdc.mp3",
  "Clean Arppegios": "assets/audio/clean_arpe.mp3",
  "NEM_Lead1": "assets/audio/nem_ogg/lead1.ogg",
  "NEM_Lead2": "assets/audio/nem_ogg/lead2.ogg",
  "NEM_Rythm1": "assets/audio/nem_ogg/rythm1.ogg",
  "NEM_Rythm2": "assets/audio/nem_ogg/rythm2.ogg",
  "NEM_Drums": "assets/audio/nem_ogg/drums.ogg",
  "NEM_Bass": "assets/audio/nem_ogg/bass.ogg",
  "NEM_Vocals": "assets/audio/nem_ogg/vocals.ogg",
};

let audioBuffers = [];
let audioPresets = [];
let userAudioPresets = [];
let managerPresets = [];
let userManagerPresets = [];
let cabinetsIR = [];
let FXlist = {};
let loop;
let instrument;
let source;
let manager;
let blankPreset;

let boundedListeners = [];
let hiddenFX = [];
let visibleFX = [];
let createdFX = [];

let smoothLevel1 = 0;
let smoothLevel2 = 0;

const fxListElemt = $("#fx-list");
const loops = $("#loops");
const loopsManagers = $("#managers");
const presetsContainer = $("#presetsContainer");
const spectrumCard = $(".spectrum-card");
const chunkCard = $(".audio-chunk-card");
const audioCanvas = $("#audio-canvas");
const spectrumCanvas = document.querySelector("#spectrum-canvas");

const loopModal = $("#loopChangeModal");
const presetModal = $("#presetLoader");
const managerPresetModal = $("#managerPresetLoader");
const patchModal = $("#patchFX");
const IRModal = $("#IRModal");

async function loadAllIRs(audioContext) {
  try {
    const response = await fetch("assets/cabs/cabinets.json");
    const data = await response.json();
    const cabinets = data.Cabinets;
    let index = 0;
    let categIndex = 0;

    for (const cabinet of cabinets) {
      const category = cabinet.name;
      const optionCateg = $(`<div class="fx-item ir-categ" data-categ="${category}">${category}</div>`);
      const option = $(`<div class="fx-list2 fx-details" style="flex-grow: 3; display: none!important;" id="${category}-irs"></div>`);
      IRModal.find('.navbar').append(optionCateg);
      IRModal.find(".fx-content").append(option);

      for (const ir of cabinet.irs) {
        const buffer = await loadIRBuffer(audioContext, ir.url);

        $(`#${category}-irs`).append(`
          <div class="fx-item fx-desc load-ir">
            <span>${ir.name}</span>
            <div class="fx-description">
              <div class="details-container">
                <div class="details-desc">
                  <p>${ir.description}</p>
                  <div class="details-blob"><label style="font-weight: bold">Speakers: </label>${ir.speakers}</div>
                  <div class="details-blob"><label style="font-weight: bold">Microphone: </label>${ir.mic}</div>
                  <div class="details-blob"><label style="font-weight: bold">Mic Position: </label>${ir.mic_pos}</div>
                  <div class="details-blob"><label style="font-weight: bold">Configuration: </label>${ir.configuration}</div>
                  <div class="details-blob"><label style="font-weight: bold">Sound: </label>${ir.sound}</div>
                  <a class="add-ir" data-id="${index}">Load</a>
                </div>
                <div class="details-image-wrapper">
                  <img class="details-image" src="${ir.image}" alt="">
                </div>
              </div>
            </div>
          </div>
        `);

        cabinetsIR.push({
          name: ir.name,
          category: category,
          url: ir.url,
          image: ir.image,
          description: ir.description,
          buffer: buffer
        });

        index++;
      }

      categIndex ++;
    }
  } catch (error) {
    console.error("Eroare la cabinets:", error);
  }
}

async function loadAudioBuffer(audioContext, url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

async function loadAllAudio(audioContext) {
  const entries = Object.entries(audioList);
  let id = 0;

  for (let [name, url] of entries) {
    try {
      const buffer = await loadAudioBuffer(audioContext, url);
      audioBuffers[name] = buffer;

      $('#audio_list').append(
        `<div class="fx-item add-audio" data-id="${id}">${name}</div>`
      );

      id++;
    } catch (err) {
      console.error(err);
    }
  }
}

async function loadFXList() {
  const res = await fetch('FXlist.json');
  const manifest = await res.json();
  let index = 0;

  manifest.FXList.forEach(category => {
    FXlist[index] = {};

    category.fx.forEach(fx => {
      FXlist[index][fx.id] = {name: fx.name, node: fx.nodeType};
    });

    index++;
  });
}

async function storeAudioPresets(fileNames) {
  let categories = [];

  for (const name of fileNames) {
    try {
      const res = await fetch(`assets/presets/audio/${name}`);
      const json = await res.json();
      const category = json.category.toLowerCase();
      audioPresets.push(json);

      if (!categories.includes(category)) {
        $("#presetLoader").find('.navbar').append(`
          <div class="fx-item audio-preset-categ" data-categ="${category}">${json.category}</div>  
        `);
        presetsContainer.append(`
          <div class="fx-list2 fx-details" style="flex-grow: 3; display: none !important;" id="audio-${category}-presets"></div>
        `);

        categories.push(category);
      }

      $(`#audio-${category}-presets`).append(`
        <div class="fx-item load-preset" data-id="${audioPresets.length - 1}" data-userMade="${json.isUserMade}">${json.presetName}</div>
      `);

      // presetsList.append(`
      //   <div class="fx-item load-preset" data-id="${audioPresets.length - 1}" data-user="${json.isUserMade}">${json.presetName}</div>  
      // `);

    } catch (err) {
      console.error(`Failed to load preset ${name}:`, err);
    }
  }
}

async function storeManagerPresets(fileNames) {
  for (const name of fileNames) {
    try {
      const res = await fetch(`assets/presets/manager/${name}`);
      const json = await res.json();
      managerPresets.push(json);
      $("#managerSystemPresets").append(`
        <div class="fx-item load-manager-preset" data-id="${managerPresets.length - 1}">${json.managerName}</div>
      `);
    } catch (err) {
      console.error(`Failed to load preset ${name}:`, err);
    }
  }
}

async function loadAllPresets() {
  // Blank Manager Preset
  const blankRes = await fetch(`assets/presets/manager/blank.json`);
  blankPreset = await blankRes.json();

  // Check for user made presets
  const data1 = localStorage.getItem("userManagerPresets");
  if (data1) {
    userManagerPresets = JSON.parse(data1);
    updateManagerPresets();
  }

  const data2 = localStorage.getItem("userAudioPresets");
  if (data2) {
    userAudioPresets = JSON.parse(data2);
    updateAudioPresets();
  }

  // Audio Presets
  try {
    const res = await fetch('assets/presets/audio/audio.json');
    const presetFiles = await res.json();
    await storeAudioPresets(presetFiles);
  } catch (err) {
    console.error("Failed to load audio preset manifest:", err);
  }

  // Manager Sys Presets
  try {
    const res = await fetch('assets/presets/manager/manager.json');
    const presetFiles = await res.json();
    await storeManagerPresets(presetFiles);
  } catch (err) {
    console.log("Failed to load manager preset manifest");
  }
}

function getValuesFrom(fxID) {
  let inputValues = [];

  $(`#${fxID}`).find('input, select, textarea').each(function () {
    // const id = $(this).attr('id');
    const value = $(this).val();
    inputValues.push(value);
  });

  return inputValues;
}

async function loadIRBuffer(context, url) {
  const response = await fetch(url);
  const arrBuffer = await response.arrayBuffer();
  return await context.decodeAudioData(arrBuffer);
}

function findBufferIndex(bufferToFind) {
  for (const [name, buffer] of Object.entries(audioBuffers)) {
      if (buffersAreEqual(bufferToFind, buffer)) {
          return name;
      }
  }
  return null;
}

function buffersAreEqual(buffer1, buffer2) {
  if (buffer1.numberOfChannels !== buffer2.numberOfChannels ||
      buffer1.sampleRate !== buffer2.sampleRate ||
      buffer1.length !== buffer2.length) {
      return false;
  }

  for (let channel = 0; channel < buffer1.numberOfChannels; channel++) {
      const channelData1 = buffer1.getChannelData(channel);
      const channelData2 = buffer2.getChannelData(channel);
      
      for (let i = 0; i < channelData1.length; i++) {
          if (channelData1[i] !== channelData2[i]) {
              return false;
          }
      }
  }

  return true;
}

function mapValue(value, inMin, inMax, outMin = 0, outMax = 10) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

async function addFX(loop, type) {
  let node;
  if (type == 'cab') {
    if (cabinetsIR == null) {
      await loadAllIRs(context);
    }
    node = new Convolver(context, cabinetsIR[0].buffer, cabinetsIR[0].name);
  } else if (type == 'gate') {
    node = new FXType[type](context, loop.getInputAnalyser());
  } else {
    node = new FXType[type](context);
  }

  loop.addFX(node);
}

function removeFX(loop, index) {
  // console.log(loop);

  loop.removeFX(index);
  manager.updateUI();
}

function addToVisible(fxID, force = false) {
  if (visibleFX.includes(fxID) && force == false) {
    return;
  }

  if (force == true) {
    visibleFX = [];
    visibleFX.push(fxID);
    return;
  }

  visibleFX.push(fxID);
  updateVisibleFX(fxListElemt);
  // console.log(visibleFX);
}

function initLoopSliders(index) {
  const fxID = `#FX${index}-`;

  if (!boundedListeners.includes(fxID + 'input')) {
    $(document).on('valueChange',  fxID + 'input', function(e, data) {
      if (!data)
        return;
      
      manager.setMaster(index, data.value);
    });

    $(document).on('valueChange',  fxID + 'pan', function(e, data) {
      if (!data)
        return;
      
      manager.setLoopPan(index, data.value);
    });

    $(document).on('valueChange',  fxID + 'gate', function(e, data) {
      if (!data)
        return;
      
      manager.setGate(index, data.value);
    });

    boundedListeners.push(fxID + 'input');
  }
}

function updateFXLoopUI(loop, skip = false) {
  // FX Chain
  const loopElem = buildFXLoop(loop.getIndex());
  // const types = loop.getFXTypes();
  const types = loop.getFXTypesFull();
  
  for (let i = 0; i < types.length; i++) {
    addToFXLoopUI(loop, loopElem, types[i], i);
    const fxID = `FX${loop.getIndex()}-${i}`;
    const fxControls = $(`#FX${loop.getIndex()}-${i}-controls`);

    if (!boundedListeners.includes("#" + fxID)) {
      $(document).on('click', `#FX${loop.getIndex()}-${i}-node`, function (e) {
        if ($(e.target).closest('.fx-hover-menu').length || $(e.target).hasClass('fx-close-btn')) return;

        addToVisible(fxID + "-", true);
        updateVisibleFX(fxListElemt);
      });
      boundedListeners.push("#" + fxID);
    }
  }
  $(`#Loop-${loop.getIndex()}-list`).append(loopElem);

  // FX Controls
  let nodes = loop.getNodes();

  for (let i = 0; i < nodes.length; i++) {
    const fxID = `FX${loop.getIndex()}-${i}-`;
    const fxControls = $(`#FX${loop.getIndex()}-${i}-controls`);
    buildFXControl(fxListElemt, loop, nodes[i], i);
    
    if (!visibleFX.includes(fxID)) {
      fxControls.addClass("hide");
    } else {
      fxControls.removeClass("hide");
    }

    // Controls and ON/OFF toggle -> listeners
    if (!boundedListeners.includes(`#${fxID}controls input`)) {
      $(document).on('valueChange', `#FX${loop.getIndex()}-${i}-controls .slider`, function(e, data) {
        if (!data)
          return;
  
        const newVal = data.value;
        const valID = data.index;
        let values = getValuesFrom(`FX${loop.getIndex()}-${i}-controls`);
        
        values[valID] = newVal;
        loop.setParams(i, values);
      });

      boundedListeners.push(`#${fxID}controls input`);
    }
    if (!boundedListeners.includes(`#${fxID}toggle`)) {
      $(document).on('click', `#FX${loop.getIndex()}-${i}-toggle`, function() {
        const $button = $(this);
        const isPressed = $button.attr('aria-pressed') === 'true';
        $button.attr('aria-pressed', !isPressed);

        loop.toggle(i);
        changeToggleButton(`#${fxID}toggle`, loop.isActive(i));
      });

      boundedListeners.push(`#${fxID}toggle`);
    }

    // Specific listeners
    if (nodes[i].type == 'amp') {
      $(`#FX${loop.getIndex()}-${i}-channel`).click(function (){
        const $button = $(this);
        const isPressed = $button.attr('aria-pressed') === 'true';
        $button.attr('aria-pressed', !isPressed);

        loop.toggleChannel(i);
      });
    } else if (nodes[i].type == 'cab') {
      const bufferName = nodes[i].getBufferName();
      $(`#FX${loop.getIndex()}-${i}`).find('.ir-display').html(bufferName);

      if (!boundedListeners.includes(`#${fxID}ir2`)) {
        $(document).on('click', `#FX${loop.getIndex()}-${i}-ir2`, function () {
          IRModal.data("loop", loop.getIndex());
          IRModal.data("index", i);

          IRModal.find('.fx-content').children().each(function() {
            if (!$(this).hasClass("navbar")) {
              $(this).hide();
            }
          });
          IRModal.find('.ir-categ').each(function () {
            $(this).removeClass('active active-nav');
          });
          IRModal.find(".ir-categ[data-categ='Mesa']").addClass('active active-nav');
          $("#Mesa-irs").show();

          IRModal.fadeIn(300);
          IRModal.addClass("modal-visible");
        });

        boundedListeners.push(`#${fxID}ir2`);
      }

      if (!boundedListeners.includes(`#${fxID}ir`)) {
        $(document).on('input', `#FX${loop.getIndex()}-${i}-ir`, function () {
          const selected = $(this).val();
          // loop.setBuffer(i, irBuffers[selected], getIRKey(irList[selected]));
          loop.setBuffer(i, cabinetsIR[selected].buffer, cabinetsIR[selected].name);
        });

        boundedListeners.push(`#${fxID}ir`);
      }
    } else if (nodes[i].type == 'swc') {
      $(`#FX${loop.getIndex()}-${i}-mode`).click(function (){
        const $button = $(this);
        const isPressed = $button.attr('aria-pressed') === 'true';
        $button.attr('aria-pressed', !isPressed);

        loop.toggleChannel(i);
      });

      $(`#FX${loop.getIndex()}-${i}-configure`).click(function (){
        patchModal.data('id', loop.getIndex());
        updatePresetsToPatchModal(nodes[i], loop.getIndex());

        patchModal.fadeIn(300);
        patchModal.addClass('modal-visible');
      });

      const routeNames = nodes[i].getRouteNames();
      routeNames.forEach((route, index) => {
        const input = $(`#FX${loop.getIndex()}-${i}-${route}`);
        $(`#FX${loop.getIndex()}-${i}-controls`).find(`.${route}-button`).click(async function () {
          const $this = $(this);
          const $container = $this.closest(`#FX${loop.getIndex()}-${i}-controls`);
        
          if (!nodes[i].hasRoute(index)) {
            $(`#FX${loop.getIndex()}-${i}-configure`).click();
            $('.patch-button').removeClass('active-nav');
            routeNames.forEach((rt) => {
              $(`#${rt}-list`).hide();
            });

            $(`.patch-button[data-button='${route}']`).addClass('active-nav');
            $(`#${route}-list`).show();
            return;
          }

          $container.find(`.route-button`).each(function () {
            $(this).attr("data-active", "false");
            $(this).data("active", false);
        
            const input = $(this).siblings("input");
            if (input.length) {
              input.val(0);
            }
          });
          
          const presetData = nodes[i].getRoute(index).split("-");
          const preset = presetData[0] == 0 ? audioPresets[presetData[1]] : userAudioPresets[presetData[1]].preset;

          nodes[i].addActive(index);
          await manager.loadAudioPreset(loop.getIndex(), preset);
          displayOnly(loop.getIndex(), manager.getLoopSize(loop.getIndex()) - 1);

          $this.attr("data-active", "true");
          $this.data("active", true);
        
          const input = $this.siblings("input");
          if (input.length) {
            input.val(1);
          }
        });
      });

      $(`#FX${loop.getIndex()}-${i}-controls`).find('.current-route').html(nodes[i].setCurrentRouteName());
    }

    initializeSliders(loop, i);
    
    let values = loop.getFXPreset(i).values;
    if (values == null) {
      values = [];
    } else if (values.length == 1) {
      values = values[0];
    }

    updateFXControls(loop, nodes[i].type, i, values);
  }
}

function getInstrument() {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSupression: false,
      latency: 0
    }
  });
}

async function record(loop) {
  instrument = await getInstrument();
  source = context.createMediaStreamSource(instrument);

  if (context.state == 'suspended') {
    await context.resume();
  }

  source.connect(loop.getInput());
  loop.connect(context.destination);
}

function stopRecording(loop) {
  source.disconnect();
  loop.disconnect();
  instrument.getTracks().forEach(track => track.stop());
}

async function playAudio(src, loop) {
  const audioElem = new Audio(src);
  const source = context.createMediaElementSource(audioElem);

  source.connect(loop.getInput());
  loop.connect(context.destination);

  audioElem.play();
}

async function createLoopFromPreset(presetJson) {
  const presetCopy = JSON.parse(JSON.stringify(presetJson));
  const { fxNodes, nodes } = presetCopy;
  const loop = new FXLoop(context, "FX Loop", 0);
  const sortedNodes = Object.keys(nodes).sort().map(key => nodes[key]);

  for (let i = 0; i < sortedNodes.length; i++) {
    const nodeData = sortedNodes[i];
    let type = nodeData.type;
    const subtype = nodeData.subtype;
    let values = nodeData.values;

    if (subtype != null && subtype != "") {
      type = subtype;
    }

    console.log(type);

    if (values.length == 1) {
      values = values[0];
    }

    await addFX(loop, type);

    loop.setFXName(i, nodeData.name);
    loop.setPreset(i, values);
  }
  
  return loop;
}

function updateJustifyContent() {
  const $fxControls = $('.fx-controls');
  const isOverflowing = $fxControls[0].scrollWidth > $fxControls[0].clientWidth;
  const hasCards = $('.fx-list .fx-card').length > 0;
  const visibleCards = $('.fx-list .fx-card:not(.hide)').length;
  const height = "350px";

  
  if (hasCards) {
    $fxControls.css('height', height);
  } else {
    $fxControls.css('height', '0px');
  }

  if (visibleCards == 0) {
    $fxControls.css('height', '0px');
  } else {
    $fxControls.css('height', height);
  }

  if (isOverflowing) {
    $fxControls.css('justify-content', 'flex-start');
  } else {
    $fxControls.css('justify-content', 'center');
  }

  if (visibleCards == 1) {
    $fxControls.css('justify-content', 'center');
  } else {
    $fxControls.css('justify-content', 'flex-start');
  }
}

function stopOverflow(element) {
  const windowW = $(window).width();
  const windowH = $(window).height();
  const cardW = element.outerWidth();
  const cardH = element.outerHeight();
  const padding = 5;

  let left = element.offset().left;
  let top = element.offset().top;

  if (left <= padding) {
    left = padding;
  }

  if (windowW - (left + cardW) <= padding) {
    left = windowW - cardW - padding;
  }

  if (top <= padding) {
    top = padding;
  }

  if (windowH - (top + cardH) <= padding) {
    top = windowH - cardH - padding;
  }

  element.animate({ top: top, left: left }, 150);
}

$(document).ready(async function () {
  await loadAllIRs(context);
  await loadAllPresets();
  await loadFXList();
  await loadAllAudio(context);
  updateJustifyContent();
  
  fetch("FXlist.json").then(res => res.json()).then(manifest => buildFXModal(manifest));
  // document.body.style.zoom = "130%";

  spectrumCard.draggable({
    handle: '.fx-header',
    stop: function(event, ui) {
      stopOverflow($(this));
    }
  });
  chunkCard.draggable({
    handle: '.fx-header',
    stop: function(event, ui) {
      // stopOverflow($(this));
    }
  });
  initSpectrumSliders();

  manager = new FXManager(context);

  $(document).on('click', '.spectrum.close-btn', function() {
    spectrumCard.fadeOut(300, function () {
      spectrumCard.addClass('hide');
    });
  });

  $(document).on('click', '.audio-chunk.close-btn', function() {
    chunkCard.fadeOut(300, function () {
      chunkCard.addClass('hide');
    });
  });

  $(document).on('click', '.spec-btn', function() {
    const loopIndex = spectrumCard.data('id');
    const spec = $(this).data('spec');
    let values = { min:0, max:24000 };

    if (spec == 'low') {
      values = { min:20, max:250 };
    } else if (spec == 'mid') {
      values = { min:250, max:4000 };
    } else if (spec == 'hi') {
      values = { min:4000, max:10000 };
    }

    manager.setSpectrumX(loopIndex, values.min, values.max);
  })

  $(document).on('click', '.trim-btn', function() {
    const loopIndex = loopModal.data('id');
    const trimCut = $(".trim-btn[data-cut='1']");
    const trimShow = $(".trim-btn[data-cut='0']");
    const trimBtn = $(this).data('cut');
    const trimmer = $(`[data-id="trimmer"]`);
    const trimVals = $(".trim-vals");
    const trimTime = $("#trim-time");

    console.log(trimmer);

    if (trimCut.hasClass('hide')) {
      trimCut.removeClass('hide'); 
      trimShow.addClass('trim-on');

      trimmer.show();
      trimVals.show();
    } else {
      trimCut.addClass('hide');  
      trimShow.removeClass('trim-on');

      trimmer.removeClass('off');
      trimmer.addClass('on');

      trimmer.hide();
      trimVals.hide();
    }

    if (trimBtn == 1) {
      const start = trimTime.data('start');
      const end = trimTime.data('end');

      console.log(start, end);
      manager.setTrim(loopIndex, start, end);
    }
  })

  $(document).on('click', "#displayAudioChunk", function() {
    const loopIndex = loopModal.data('id');

    loopModal.fadeOut(300, function () {
      loopModal.removeClass('modal-visible');
    });

    chunkCard.fadeIn(300, function () {
      manager.createWaveFor(loopIndex);
      chunkCard.removeClass('hide');
    });
  });

  $(document).on('click', "#displaySpectrum", function() {
    const loopIndex = loopModal.data('id');
    const color = manager.getColor(loopIndex);
    spectrumCard.data("id", loopIndex);

    spectrumCard.find('.fx-header').css('background-color', color);
    spectrumCard.find('.spectrum-title').css('color', (getFontColorForBg(color) == 1 ? 'black' : 'white'));
    spectrumCard.find('.spectrum-title span').html(`Spectrum - ${manager.getName(loopIndex)}`);

    loopModal.fadeOut(300, function () {
      loopModal.removeClass('modal-visible');
    });

    spectrumCard.fadeIn(300, function () {
      spectrumCard.removeClass('hide');
      manager.startSpectrumAnalyzer(loopIndex, spectrumCanvas);
    });
  });

  $(document).on('click', "#play", function() {
    const loopIndex = $(this).data('id');
    let playing = false;

    if (!manager.isPlaying(loopIndex)) {
      playing = manager.startAudio(loopIndex);
    } else {
      manager.stopAudio(loopIndex, true);
    }

    if (playing) {
      $(this).addClass('play-btn');
      $(this).html("Stop");
    } else {
      $(this).removeClass('play-btn');
      $(this).html("Play");
    }
  });

  $(document).on('click', "#rec", async function() {
    const loopIndex = $(this).data('id');
    let recording = false;

    if (!manager.isRecording(loopIndex)) {
      instrument = await getInstrument();
      recording = manager.startRec(loopIndex, instrument);
    } else {
      manager.stopRec(loopIndex);
    }

    if (recording) {
      $(this).addClass("mute-on");
    } else {
      $(this).removeClass("mute-on");
    }
  });

  $(document).on('click', "#loop", async function() {
    const loopIndex = $(this).data('id');
    
    if (manager.isRecording(loopIndex)) {
      return;
    }

    if (manager.isLoopOn(loopIndex)) {
      manager.setLoopOff(loopIndex);
      $(this).removeClass("loop-on");
    } else {
      manager.setLoopOn(loopIndex);
      $(this).addClass("loop-on");
    }
  });

  $(document).on('click', "#loadAudio", function() {
    const loopIndex = $(this).data('id');
    $("#audioModal").data('id', loopIndex);

    $("#audioModal").fadeIn(300);
    $("#audioModal").addClass('modal-visible');
  });

  $(document).on('click', "#loadPreset", function() {
    const loopIndex = $(this).data("id");
    presetModal.data('id', loopIndex);

    presetModal.fadeIn(300);
    presetModal.addClass('modal-visible');
  });

  $(document).on("click", "#managerPreset", function() {
    managerPresetModal.fadeIn(300);
    managerPresetModal.addClass('modal-visible');
  });

  $(document).on("click", "#saveManager", function() {
    if (!manager || (manager.getSize() == 0)) {
      return;
    }

    const presetIndex = $(this).data("id");
    const preset = manager.getPreset();
    const userMade = $(this).data("userMade");
    let id = 0;

    if (presetIndex == -1 || (presetIndex != -1 && userMade == -1)) {
      id = userManagerPresets.length;
      userManagerPresets[id] = {
        index: id,
        preset: preset
      }
    } else {
      if (userManagerPresets.hasOwnProperty(presetIndex)) {
        userManagerPresets[presetIndex].preset = preset;
      }
    }

    $(this).data('id', id);
    $(this).data('userMade', 1);

    localStorage.setItem("userManagerPresets", JSON.stringify(userManagerPresets));
    updateManagerPresets();
  });

  $(document).on('click', "#savePreset", function () {
    if (!manager || (manager.getSize() == 0)) {
      return;
    }

    const presetIndex = $(this).data("presetIndex");
    const isUserMade = $(this).data("userMade"); 
    let presetName = $(this).data("presetName");

    presetName = prompt("Enter a preset name", presetName);
    if (presetName == null)
      return;

    const loopIndex = $(this).data("id");
    const preset = manager.getLoopPreset(loopIndex);
    let index = userAudioPresets.findIndex(p => p.presetName == presetName);
    console.log(index);

    if (index != -1) {
      userAudioPresets[index].preset = preset;
    } else {
      index = userAudioPresets.length;

      userAudioPresets.push({
        index: index, 
        presetName: presetName,
        preset: preset
      });
    }

    $(this).data("userMade", "true");
    $(this).data("presetName", presetName);
    $(this).data("presetIndex", presetIndex);

    localStorage.setItem("userAudioPresets", JSON.stringify(userAudioPresets));
    updateAudioPresets();
  });

  $(document).on('click', ".load-preset", async function() {
    const presetIndex = $(this).data('id');
    const userIndex = $(this).data('user');
    const loopIndex = presetModal.data('id');
    let preset;
    
    if (userIndex != null) {
      preset = userAudioPresets[userIndex].preset;
    } else {
      preset = audioPresets[presetIndex];
    }

    await manager.loadAudioPreset(loopIndex, preset);
    
    presetModal.fadeOut(300);
    presetModal.removeClass("modal-visible");
    displayOnlyFXLoop(loopIndex);

    const saveElement = $(`#Loop-${loopIndex}`).find("#savePreset");
    saveElement.data("userMade", preset.isUserMade);
    saveElement.data("presetName", preset.presetName);
    saveElement.data("presetIndex", presetIndex);
  });

  $(document).on('click', ".load-manager-preset", async function() {
    const presetIndex = $(this).data("id");
    const userIndex = $(this).data("user");

    if (presetIndex != null) {
      await manager.loadPreset(managerPresets[presetIndex]);
      $("#saveManager").data('id', presetIndex);
      $("#saveManager").data('userMade', -1);
      $("#deletePreset").hide();
    } else if (userIndex != null) {
      if (userManagerPresets.length == 0 || (userManagerPresets[userIndex]  == null)) {
        return;
      }

      await manager.loadPreset(userManagerPresets[userIndex].preset);
      $("#saveManager").data('id', userIndex);
      $("#saveManager").data('userMade', 1);
      $("#deletePreset").show();
    }

    managerPresetModal.fadeOut(300);
    managerPresetModal.removeClass("modal-visible");
    displayOnlyFXLoop(0);
  });

  $(document).on('click', ".add-audio", function() {
    const loopIndex = $("#audioModal").data('id');
    const buffer = Object.values(audioBuffers)[$(this).data('id')];

    manager.loadAudioBuffer(loopIndex, buffer);
    if (manager.hasBuffer(loopIndex)) {
      $("#audioModal").fadeOut(300, function () {
        $("#audioModal").removeClass('modal-visible');
      });
    }
    updateButtons(manager.getTheLoop(loopIndex), loopIndex);
  });

  $(document).on('click', "#addTrack", async function() {
    if (manager == null) {
      manager = new FXManager(context);
    }
    manager.createLoop("Track");
    const size = manager.getSize();

    if (size == 1) {
      manager.init();
    } else if (size > 1) {
      manager.setName(size - 1, `Track ${size}`);
      manager.setColor(size - 1, getRandomHexColor());
      manager.updateUI();
      displayOnlyFXLoop(size - 1);
      manager.connectLoop(manager.getSize() - 1);
    }
  });

  $(document).on('click', "#loop-name", function() {
    const loopIndex = $(this).data('id');
    displayOnlyFXLoop(loopIndex);
  });

  $(document).on('click', "#mute", function() {
    const loopIndex = $(this).data("id");
    
    if (manager.isMuted(loopIndex)) {
      manager.unmute(loopIndex);
      $(this).removeClass("mute-on");
    } else {
      manager.mute(loopIndex);
      $(this).addClass("mute-on");
    }
  });

  $(document).on('click', '#solo', function() {
    const loopIndex = $(this).data('id');

    if (!manager.isSolo(loopIndex)) {
      manager.setSolo(loopIndex);
      $(this).addClass("solo-on");
    } else {
      manager.setSolo(loopIndex, false);
      $(this).removeClass("solo-on");
    }
  });

  $(document).on('click', "#loop-details", function(e) {
    const loopIndex = $(this).data("id");
    const header = loopModal.find(".fx-header");
    loopModal.data('id', loopIndex);

    $("#loopname").attr("style", `color: ${getFontColorForBg(manager.getColor(loopIndex)) == 1 ? 'black' : 'white'}!important`);
    $("#loopname").val(manager.getName(loopIndex));
    $("#colorPicker").val(manager.getColor(loopIndex));

    header.attr("style", `background-color: ${manager.getColor(loopIndex)}!important`);

    loopModal.fadeIn(300);
    loopModal.addClass('modal-visible');
  });

  $(document).on('change', "#loopname",function() {
    const loopIndex = loopModal.data('id');
    manager.setName(loopIndex, $(this).val());
    manager.updateUI();
    displayOnlyFXLoop(loopIndex);
    spectrumCard.find('.spectrum-title span').html(`Spectrum - ${$(this).val()}`);
  })

  $(document).on("change", "#project-name", function() {
    if (!manager) {
      return;
    }

    manager.setManagerName($(this).val());
  });

  $(document).on('click', ".color-item",function() {
    const loopIndex = loopModal.data('id');
    $("#colorPicker")[0].click();
  });

  $(document).on('click', "#deletePreset", async function() {
    const confirmed = confirm("Are you sure you want to delete this preset ?");
    if (!confirmed) {
      return;
    }

    const presetIndex = $("#saveManager").data('id');
    const userMade = $("#saveManager").data('userMade');

    const item = $("#managerUserPresets").find(`.load-manager-preset[data-user='${presetIndex}']`);
    if (!item)  {
      return;
    }
    item.remove();

    userManagerPresets.splice(presetIndex, 1);
    userManagerPresets.forEach((preset, i) => {
      preset.index = i;
      $("#manager-presets").find(`.load-manager-preset[data-user='${presetIndex}']`).data("user", i);
    });

    localStorage.setItem("userManagerPresets", JSON.stringify(userManagerPresets));
    manager.loadPreset(blankPreset);
    // updateManagerPresets();
  });

  $(document).on('click', "#deleteLoop", function() {
    const confirmed = confirm("Are you sure you want to delete this ?");
    if (!confirmed) {
      return;
    }

    const loopIndex = loopModal.data("id");
    manager.removeLoop(loopIndex);
    manager.updateUI();

    loopModal.fadeOut(300, function () {
      loopModal.removeClass('modal-visible');
    });
  });

  $(document).on('input', "#colorPicker",function() {
    const color = $(this).val();
    const loopIndex = loopModal.data('id');

    manager.setColor(loopIndex, color);

    spectrumCard.find('.fx-header').css('background-color', color);
    spectrumCard.find('.spectrum-title').css('color', (getFontColorForBg(color) == 1 ? 'black' : 'white'));

    updateSliderColors(loopIndex, color);
  });

  $(document).on('click', '.fx-item', function () {
    $('.fx-item').not(this).removeClass('active');
    $(this).toggleClass('active');
  });

  $(document).on('click', '.navbar .fx-item', function () {
    $('.fx-item').not(this).removeClass('active-nav');
    $(this).toggleClass('active-nav');
  });

  $(document).on('click', '.preset-categ', function () {
    const type = $(this).data("categ");
    const userPresets = $("#managerUserPresets");
    const sysPresets = $("#managerSystemPresets");

    if (type == "sys") {
      userPresets.hide();
      sysPresets.show();
    } else if (type == "user") {
      userPresets.show();
      sysPresets.hide();
    }
  });

  $(document).on('click', '.audio-preset-categ', function () {
    const type = $(this).data("categ");
    const toShow = $(`#audio-${type}-presets`);

    presetsContainer.children().each(function() {
      if (!$(this).hasClass("navbar")) {
        $(this).hide();
      }
    });

    toShow.show();
  });

  $(document).on('click', '.ir-categ', function () {
    const type = $(this).data("categ");
    const toShow = $(`#${type}-irs`);

    IRModal.find('.fx-content').children().each(function() {
      if (!$(this).hasClass("navbar")) {
        $(this).hide();
      }
    });

    toShow.show();
  });

  $(document).on('click', ".add-ir", async function() {
    const loopIndex = IRModal.data("loop");
    const cabIndex = IRModal.data("index");
    const irIndex = $(this).data("id");
    const selected = cabinetsIR[irIndex];

    if (!selected) return;

    manager.setBuffer(loopIndex, cabIndex, selected);
    $(`#FX${loopIndex}-${cabIndex}-controls`).find('.ir-display').html(selected.name);

    IRModal.fadeOut(300, function () {
      IRModal.removeClass('modal-visible');
    });
  });

  $(document).on('click', '.patch-button', function () {
    const route = $(this).data("button");
    $("#patchFX").find(".fx-content").children().each(function() {
      if (!$(this).hasClass("navbar")) {
        $(this).hide();
      }
    });

    $(`#${route}-list`).show();
  });

  $(document).on('click', '.load-patch-preset', function() {
    const loopIndex = patchModal.data("id");
    const route = $(this).parent().data("button");
    const presetIndex = $(this).data("id");
    const userIndex = $(this).data("user");
    const presetName = $(this).html();
    let preset;

    if (userIndex != null) {
      preset = `1-${userIndex}`;
    } else {
      preset = `0-${presetIndex}`;
    }

    manager.setRoute(loopIndex, route, preset, presetName);
    $(this).siblings().removeClass("selected-preset");
    $(this).addClass("selected-preset");

    console.log("Set route for " + route);
  });

  $(document).on('click', '#addFX', async function () {
    const [categId, fxID] = $(this).data('idx').split('-');
    const loopIndex = $('#loopIndex').data('id');
    const loopPos = $('#loopIndex').data('pos');
    const loop = manager.getLoop(loopIndex);

    const node = new FXNodes[FXlist[categId][fxID].node](context);
    node.setName(FXlist[categId][fxID].name);

    if (node.type == 'cab') {
      if (cabinetsIR == null) {
        await loadAllIRs(context);
      }
      node.setImpulse(cabinetsIR[0].buffer, cabinetsIR[0].name);
    } else if (node.type == 'eq') {
      // node.addFilter(6500);
      // node.addFilter(20000);
    } else if (node.type == 'gate') {
      // node.setupAnalyser(loop.getInputAnalyser());
    }

    console.log(node.getName());
    loop.addFXat(node, loopPos);

    manager.updateUI();
    displayOnly(loopIndex, loopPos);

    $(".fx-modal-overlay").fadeOut(300, function () {
      $(".fx-modal-overlay").removeClass('modal-visible');
    });
  });

  $(document).on('click', '.fx-add', function () {
    const [loopIndex, pos] = $(this).attr('id').split('-').splice(1, 2);
    $("#loopIndex").data('id', loopIndex);

    $("#loopIndex").fadeIn(300);
    $("#loopIndex").addClass('modal-visible');
  });

  $(document).on('click', '.fx-modal-overlay', function (e) {
    if (!$(e.target).closest('.fx-card').length) {
      $(this).fadeOut(300, function () {
        $(this).removeClass('modal-visible');
      });
    }
  });

  $(document).on('click', '.to-add', function() {
    const [loopIndex, pos] = $(this).attr('id').split('-').splice(1, 2);
    $("#loopIndex").data('pos', pos);

    addBlankToFXLoop(manager.getLoop(loopIndex), pos);
  });

  $(document).on('click', '.to-swap', function() {
    const [loopIndex, id1, id2] = $(this).attr('id').split('-').splice(1, 3);
    const loop = manager.getLoop(loopIndex);
    loop.swapFX(id1, id2);
    
    manager.updateUI();
    displayOnlyFXLoop(loopIndex);
  });

  $(document).on('click', '.to-delete', function() {
    const [loopIndex, fxIndex] = $(this).attr('id').split('-').splice(1, 2);
    removeFX(manager.getLoop(loopIndex), fxIndex);

    manager.updateUI();
    displayOnlyFXLoop(loopIndex);
  });

  $(document).on('click', "#playAll", function() {
    if (manager == null) {
      return;
    }
    
    const state = manager.startAll();

    if (state == true) {
      $(this).removeClass("play-btn");
      $(this).addClass("pause-on");
    } else {
      $(this).removeClass("pause-on");
      $(this).addClass("play-btn");
    }
  });

});
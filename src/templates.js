function buildFXLoop(index) {
  const $signalFlow = $('<div>', {
    class: 'signal-flow',
    id: 'FX' + index
  });

  const $inWrapper = $('<div>', { class: 'node-wrapper', id: `line-${index}-0`});
  const $inNode = $('<a>', { class: 'node', id: 'in-node', text: 'IN' });
  const $line = `
    <div class="line-container">
      <div class="line"></div>
      <div class="line-hover-menu">
        <i class="fa-solid fa-plus to-add" id="add-${index}-0"></i>
      </div>
    </div>
  `;

  $inWrapper.append($inNode, $line);

  const $outWrapper = $('<div>', { class: 'node-wrapper' });
  const $outNode = $('<a>', { class: 'node', id: 'out-node', text: 'OUT' });

  $outWrapper.append($outNode);
  $signalFlow.append($inWrapper, $outWrapper);

  return $signalFlow;
}

function addBlankToFXLoop(loop, index) {
  index = parseInt(index);

  const nodeWrapper = $(`<div class="node-wrapper"></div>`);
  const fxNodeLink = $(`<a class="node fx-node fx-add" id="addFX-${loop.getIndex()}-${index}"><i class="fa-solid fa-plus"></a>`);

  const lineDiv = $(`
    <div class="line-container">
    <div class="line"></div>
    <div class="line-hover-menu">
    <i class="fa-solid fa-plus to-add" id="add-${loop.getIndex()}-${(index)}"></i>
    </div>
    </div>
  `);
    
  nodeWrapper.append(fxNodeLink).append(lineDiv);
  $("#line-" + loop.getIndex() + "-" + index).after(nodeWrapper);
}

function buildFXModal(manifest) {
  const $overlay = $(`
    <div class="fx-modal-overlay" id="loopIndex" data-id="0" data-pos="0">
      <div class="fx-card" style="width: 40vw; min-height: 300px">
        <div class="fx-header add-header">Add FX
        </div>
        <div class="fx-content" id="fx-list" style="width: 100%; gap: 0px; padding: 0px; flex: 1;">
          <div class="fx-list2 navbar" style="flex-grow: 5 !important"></div>
          <div class="fx-list2 fx-details" style="flex-grow: 10;"></div>
        </div>
      </div>
    </div>
  `);

  const $navbar = $overlay.find('.navbar');
  const $fxDetails = $overlay.find('.fx-details');

  manifest.FXList.forEach(cat => {
    let icon = `<i class="fa-solid ${cat.icon}"></i>`;
    if (cat.svg != null && cat.svg != "") {
      icon = `<img src="${cat.svg}" class="svg-icon" ></img>`;
    }

    const $navItem = $(`
      <div class="fx-item" id="dropFX-${cat.id}">
        ${icon} ${cat.name}
      </div>
    `);

    $navItem.on('click', () => {
      $fxDetails.empty();
      cat.fx.forEach((fx, idx) => {
        const $fxItem = $(`
          <div class="fx-item fx-desc">
            <span>${idx + 1}. ${fx.name}</span>
            <div class="fx-description">
              <p>${fx.description}</p>
              <a id="addFX" data-idx="${cat.id}-${fx.id}" class="add-btn">Add</a>
            </div>
          </div>
        `);
        $fxDetails.append($fxItem);
      });
    });

    $navbar.append($navItem);
  });

  $('body').append($overlay);
}

function buildLoopControls(loop) {
  const fontColor = getFontColorForBg(loop.color) == 1 ? "black" : "white";
  const loopIndex = loop.loop.getIndex();

  loopsManagers.append(`
    <div class="fxloop-container">
    <div class="loop-container" id="Loop-${loopIndex}">
        <div class="loop-header" style="background-color: ${loop.color}!important; color: ${fontColor}!important">
          <span id="loop-name" data-id="${loopIndex}">${loop.name}</span>
          <i id="loop-details" data-id="${loopIndex}" class="fa-solid fa-ellipsis-vertical"></i>
        </div>
        <div class="loop-controls">
          <div class="sliders-container">
            <div class="slider-item">
              <label>Volume</label>
              <input type="text" id="FX${loopIndex}-input" class="loop-slider" data-min="0.01" data-max="5" value="1">
            </div>
            <div class="slider-item">
              <label>Pan</label>
              <input type="text" id="FX${loopIndex}-pan" class="loop-slider" data-min="-1" data-max="1", value="0">
            </div>
            <div class="slider-item">
              <label>Gate</label>
              <input type="text" id="FX${loopIndex}-gate" class="loop-slider gate-slider" data-min="0.000001" data-max="0.3", value="0.001" data-step="0.0001">
            </div>
          </div>
          <div class="loop-buttons">
            <div class="loop-section">
              <label>Controls</label>
              <a class="loop-btn" id="play" data-id="${loopIndex}" >Play</a>
              <a class="loop-btn" id="mute" data-id="${loopIndex}" >Mute</a>
            </div>
            <div class="loop-section" style="align-self: flex-end;">
              <a class="loop-btn" id="rec" data-id="${loopIndex}">Rec</a>
              <a class="loop-btn" id="solo" data-id="${loopIndex}">Solo</a>
            </div>
            <div class="loop-section" style="align-self: flex-end;">
              <label>Audio</label>
              <a class="loop-btn" id="loop" data-id="${loopIndex}">Loop</a>
              <a class="loop-btn" id="loadAudio" data-id="${loopIndex}">Load</a>
            </div>
            <div class="loop-section">
              <label>Presets</label>
              <a class="loop-btn" id="loadPreset" data-id="${loopIndex}">Load</a>
              <a class="loop-btn" id="savePreset" data-id="${loopIndex}" data-userMade="false" data-presetIndex="0">Save</a>
            </div>
            <div class="loop-meters" >
              <div class="input-meter">
                <div class="meter-fill" id="loop-${loopIndex}-input"></div>
              </div>
              <div class="input-meter">
                <div class="meter-fill" id="loop-${loopIndex}-master"></div>
              </div>
            </div>
          </div>
        </div>
    </div>
    <div class="flow-list" id="Loop-${loopIndex}-list">
    
    </div>
    </div>
  `);
}

function addToFXLoopUI(loop, loopElem, type, index) {
  const outNode = loopElem.children().last();
  outNode.remove();

  const nodeWrapper = $(`<div class="node-wrapper" id="line-${(loop.getIndex())}-${(index + 1)}"></div>`);
  const fxType = type;
  
  const fxNodeLink = $(`<a class="node fx-node fx-${fxType}" id="FX${loop.getIndex()}-${index}-node">${fxType.split("_")[0].toUpperCase()}</a>`);

  const hoverDiv = $("<div class='fx-hover-menu'></div>")
  if (index != 0) {
    hoverDiv.append(`<i class="fa-solid fa-arrow-left to-swap" id="swap-${loop.getIndex()}-${(index - 1)}-${index}"></i>`);
  }
  hoverDiv.append(`<i class="fa-solid fa-xmark to-delete" id="delete-${loop.getIndex()}-${index}"></i>`);
  if (index != loop.getSize() - 1) {
    hoverDiv.append(`<i class="fa-solid fa-arrow-right to-swap" id="swap-${loop.getIndex()}-${index}-${(index + 1)}"></i>`);
  }

  fxNodeLink.append(hoverDiv);

  const lineDiv = $(`
    <div class="line-container">
      <div class="line"></div>
      <div class="line-hover-menu">
        <i class="fa-solid fa-plus to-add" id="add-${loop.getIndex()}-${index + 1}"></i>
      </div>
    </div>
  `);

  nodeWrapper.append(fxNodeLink).append(lineDiv);

  loopElem.append(nodeWrapper);
  loopElem.append(outNode);
}

function buildFXControl(listElement, loop, node, index, keepIndex = -1) {
  const fxCard = $(`<div class="fx-card" id="FX${loop.getIndex()}-${index}-controls"></div>`);
  fxCard.append(`<div class="fx-banner" style="background-color: ${loop.getColor()}"></div>`);
  const fxHeader = $(`<div class='fx-header'>${node.getName()}</div>`);
  const fxContent = $("<div class='fx-content' style='align-itmes: flex-start'></div>");

  const headerDiv = $(`<div class="power-header"></div>`);
  headerDiv.append(`
    <div class="power-section">
      <span>Power</span>
      <button id="FX${loop.getIndex()}-${index}-toggle" class="toggle-button" aria-pressed="true"></button>
    </div>
  `);
  
  if (node.getType() == 'amp') {
    headerDiv.append(`
      <div class="power-section">
        <span>Channel</span>
        <button id="FX${loop.getIndex()}-${index}-channel" class="toggle-button channel-button" aria-pressed="false"></button>
      </div>
    `);

    fxContent.append(buildAmpControls(loop, index));
  } else if (node.getType() == 'cab') {
    fxContent.append(buildCabControls(loop, index));
  } else if (node.getType() == 'flg') {
    fxContent.append(buildFlangerControls(loop, index));
  } else if (node.getType() == 'swc') {
    fxContent.append(buildSwitcherControls(loop, index, node));
    fxHeader.append(`
      <div class="power-header">
      <div class="power-section">
        <div class="configure-center">
          <span>Route</span>
          <button id="FX${loop.getIndex()}-${index}-mode" class="toggle-button mode-button" aria-pressed="false"></button>
          <span>Patch</span>
        </div>
      </div>
      </div>
    `);
  } else if (node.getType() == 'eq') {
    fxContent.append(buildEQControls(loop, index, node));
  } else if (node.getType() == 'od') {
    fxContent.append(buildOverdriveControls(loop, index, node));
  } else if (node.getType() == 'vol') {
    fxContent.append(buildVolumeControls(loop, index, node));
  } else if (node.getType() == 'gate') {
    fxContent.append(node.render(loop.getIndex(), index));
  }

  if (node.getType() != "swc") {
    fxHeader.append(headerDiv);
  }

  fxCard.append(fxHeader);
  listElement.append(fxCard);
  fxCard.append(fxContent);
  
  addToVisible(`FX${loop.getIndex()}-${index}-`, true);
  updateVisibleFX(fxListElemt);
}

function buildAmpControls(loop, index) {
  return `
    <div class="fx-control-container">
      <div class="fx-section">Clean Channel</div>
        <div class="fx-control">
          <div class="fx-grid">
            <div class="fx-knob">
              <input class="slider" id="FX${loop.getIndex()}-${index}-0" type="text" value="5" data-min="0.01" data-max="10" />
              <label>Gain</label>
            </div>
            <div class="fx-knob">
              <input class="slider" id="FX${loop.getIndex()}-${index}-1" type="text" value="0" data-min="-10" data-max="10" data-step="0.01"/>
              <label>Presence</label>
            </div>
            <div class="fx-knob">
              <input class="slider" id="FX${loop.getIndex()}-${index}-2" type="text" value="5" data-min="-15" data-max="15" data-step="0.04" />
              <label>Bass</label>
            </div>
          </div>
          <div class="fx-grid" style="margin-top: 10px">
            <div class="fx-knob">
              <input class="slider" id="FX${loop.getIndex()}-${index}-3" type="text" value="9" data-min="-6" data-max="24" data-step="0.028" />
              <label>Mid</label>
            </div>
            <div class="fx-knob">
              <input class="slider" id="FX${loop.getIndex()}-${index}-4" type="text" value="5" data-min="-25" data-max="25" data-step="0.04"/>
              <label>Treble</label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="fx-control-container">
      <div class="fx-section">Disto Channel</div>
      <div class="fx-grid">
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-5" type="text" value="5" data-min="0.01" data-max="10" />
          <label>Gain 1</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-6" type="text" value="5" data-min="0.01" data-max="10" />
          <label>Gain 2</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-7" type="text" value="5" data-min="-10" data-max="10" data-step="0.025"/>
          <label>Presence</label>
        </div>
      </div>
      <div class="fx-grid" style="margin-top: 10px">
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-8" type="text" value="5" data-min="-15" data-max="15" data-step="0.04" />
          <label>Bass</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-9" type="text" value="9" data-min="-6" data-max="24" data-step="0.028" />
          <label>Mid</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-10" type="text" value="5" data-min="-25" data-max="25"/>
          <label>Treble</label>
        </div>
      </div>
    </div>

    <div class="fx-control-container">
      <div class="fx-section">Master</div>
      <div class="fx-grid">
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-11" type="text" value="1" data-min="0.01" data-max="5" />
          <label>Volume 1</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-12" type="text" value="1" data-min="0.01" data-max="5" />
          <label>Volume 2</label>
        </div>
      </div>
    </div>
    `;
}

function buildCabControls(loop, index) {
  const cabName = loop.getNode(index).getBufferName();

  return `
    <div class="fx-control-container">
      <div class="fx-section">Type</div>
      <span class="current-route ir-display" id="FX${loop.getIndex()}-${index}-ir2">${cabName}</span>
      <div class="fx-section" style="margin-top: 10px"></div>
      <div class="fx-grid" style="width: 50%">
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-0" type="text" value="0.2" data-min="0.01" data-max="1" />
          <label>Mix</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-1" type="text" value="1" data-min="0.01" data-max="2.5" />
          <label>Volume</label>
        </div>
      </div>
    </div>
  `;
}

function buildFlangerControls(loop, index) {
  return `
    <div class="fx-control-container">
      <div class="fx-section" style="margin-top: 10px"></div>
      <div class="fx-grid">
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-0" type="text" value="0.25" data-min="0.01" data-max="10" />
          <label>Rate</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-1" type="text" value="0.003" data-min="0.0001" data-max="0.1" data-step="0.0001"/>
          <label>Depth</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-2" type="text" value="0.5" data-min="0.01" data-max="0.95" data-step="0.00095"/>
          <label>Feedback</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-3" type="text" value="1" data-min="0.01" data-max="1" data-step="0.001"/>
          <label>Mix</label>
        </div>
      </div>
    </div>
  `;
}

function buildSwitcherControls(loop, index, node) {
  return `
    <div class="fx-control-container" style="margin-top: -10px">
      <div class="fx-section"></div>
      <a class="configure" ><i class="fa-solid fa-gear" id="FX${loop.getIndex()}-${index}-configure" style="margin-bottom: 10px"></i></a>
      <span class="current-route">${node.getCurrentRoute() == "" ? 'Empty' : node.getCurrentRoute()}</span>
      <div class="routes-list">
        <div class="route-wrapper">
          <div class="route-button A-button" data-active="false"></div>
          <input class="hide" value="0" id="FX${loop.getIndex()}-${index}-A"/>
          <label>A</label>
        </div>
        <div class="route-wrapper">
          <div class="route-button B-button" data-active="false"></div>
          <input class="hide" value="0" id="FX${loop.getIndex()}-${index}-B"/>
          <label>B</label>
        </div>
        <div class="route-wrapper">
          <div class="route-button C-button" data-active="false"></div>
          <input class="hide" value="0" id="FX${loop.getIndex()}-${index}-C"/>
          <label>C</label>
        </div>
        <div class="route-wrapper">
          <div class="route-button D-button" data-active="false"></div>
          <input class="hide" value="0" id="FX${loop.getIndex()}-${index}-D"/>
          <label>D</label>
        </div>
      </div>
    </div>
  `;
}

function buildEQControls(loop, index, node) {
  const freq = node.getFreqs();
  const max = node.getGain();

  const controlContainer = $(`<div class="fx-control-container"></div>`);
  const filtersContainer = $(`<div class="filters-container"></div>`);


  for (let i = 0; i < freq.length; i++) {
    filtersContainer.append(`
      <div class="eq-band">
        <label>${(freq[i] >= 1000 ? (freq[i] / 1000) + "k" : freq[i])}</label>
        <span class="slider-label top" style="${i > 0 ? 'display: none !important;' : ''}">+${max}</span>
        <span class="slider-label bottom" style="${i > 0 ? 'display: none !important;' : ''}">-${max}</span>
        <div class="slider-wrapper">
          <input type="range" id="FX${loop.getIndex()}-${index}-${i}" min="${-max}" max="${max}" value="${node.getFilterGain(i)}" class="vertical-slider" />
        </div>
      </div>
    `);
    // if ()
  }

  controlContainer.append(filtersContainer);
  return controlContainer;
}

function buildOverdriveControls(loop, index, node) {
  const vals = node.getParams();

  return `
    <div class="fx-control-container">
      <div class="fx-section" style="margin-top: 10px"></div>
      <div class="fx-grid">
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-0" type="text" value="${vals[0]}" data-min="0.01" data-max="10" />
          <label>Drive</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-1" type="text" value="${vals[1]}" data-min="0.01" data-max="10"/>
          <label>Tone</label>
        </div>
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-2" type="text" value="${vals[2]}" data-min="0.01" data-max="5"/>
          <label>Level</label>
        </div>
      </div>
    </div>
  `;
}

function buildVolumeControls(loop, index, node) {
  const vals = node.getParams();

  return `
    <div class="fx-control-container">
      <div class="fx-section" style="margin-top: 10px"></div>
      <div class="fx-grid">
        <div class="fx-knob">
          <input class="slider" id="FX${loop.getIndex()}-${index}-0" type="text" value="${vals[1]}" data-min="0.01" data-max="5"/>
          <label>Gain</label>
        </div>
      </div>
    </div>
  `;
}

function changeToggleButton(id, state, names = ["OFF", "ON"], classes = ["btn-off", "btn-on"], modifyNode = true) {
  const btn = $(`${id}`); 
  const node = $((id.split('-')[0] + '-').concat(id.split('-')[1]) + '-node');

  if (state == 0) {
    btn.removeClass(classes[1]);
    btn.addClass(classes[0]);
    // btn.html(names[0]);

    if (modifyNode) {
      node.addClass('fx-disabled');
    }
  } else if (state == 1) {
    btn.removeClass(classes[0]);
    btn.addClass(classes[1]);
    // btn.html(names[1]);

    if (modifyNode) {
      node.removeClass('fx-disabled');
    }
  }
}

function updateProjectName(name) {
  $("#project-name").val(name);
}

function updateManagerPresets() {
  if (userManagerPresets.length == 0) {
    return;
  }

  userManagerPresets.forEach((data) => {
    const existing = $('#managerUserPresets').find(`.load-manager-preset[data-user='${data.index}']`);
  
    if (existing.length === 0) {
      $("#managerUserPresets").append(`
        <div class="fx-item load-manager-preset" data-user="${data.index}">
          ${data.preset.managerName}
        </div>
      `);
    } else {
      existing.html(data.preset.managerName);
    }
  });
}

function updateAudioPresets() {
  if (userAudioPresets.length == 0) {
    return;
  }

  userAudioPresets.forEach((data) => {
    const existing = $('#audio-user-presets').find(`.load-preset[data-user='${data.index}']`);
  
    if (existing.length === 0) {
      $("#audio-user-presets").append(`
        <div class="fx-item load-preset" data-user="${data.index}">
          ${data.presetName}
        </div>
      `);
    } else {
      existing.html(data.presetName);
    }
  });
}

function updatePresetsToPatchModal(node, loopIndex) {
  patchModal.find(".fx-content").children().not(".navbar").remove();
  const routes = node.getRouteNames();

  for (const route of routes) {
    const preset = node.getRoute(routes.indexOf(route)).split('-');

    const routeList = $(`
      <div class="fx-list2 fx-details" style="flex-grow: 3;" id="${route}-list" data-button="${route}" data-preset="-1"></div>
    `); 
    
    audioPresets.forEach((data, index) => {
      routeList.append(`
        <div class="fx-item load-patch-preset ${(preset[0] == 0 && preset[1] == index) ? 'selected-preset' : ''}" data-id="${index}" data-userMade="${data.isUserMade}">${data.presetName}</div>
      `);
    });

    userAudioPresets.forEach((data) => {
      routeList.append(`
        <div class="fx-item load-patch-preset ${(preset[0] == 1 && preset[1] == data.index) ? 'selected-preset' : ''}" data-user="${data.index}" data-userMade="true">${data.presetName}</div>
      `);
    });

    routeList.hide();
    if (route == "A") {
      routeList.show();
      $(`.patch-button[data-button='A']`).addClass('active-nav');
      $(`.patch-button[data-button='B']`).removeClass('active-nav');
      $(`.patch-button[data-button='C']`).removeClass('active-nav');
      $(`.patch-button[data-button='D']`).removeClass('active-nav');
    }
    patchModal.find('.fx-content').append(routeList);
  }
}

function updateLoopControls(loop, index) {
  const input = $(`#FX${index}-input`);
  const pan = $(`#FX${index}-pan`);
  const gate = $(`#FX${index}-gate`);

  const inputVal = loop.getMaster();
  const panValue = loop.getPan();
  const gateValue = loop.getGate();

  input.roundSlider("setValue", inputVal);
  let rs = input.data("roundSlider");
  let tooltip = $(rs.container).find(".knob-tooltip");
  tooltip.text(`${mapToPercentage(inputVal, rs)}`);

  pan.roundSlider("setValue", panValue);
  rs = pan.data("roundSlider");
  tooltip = $(rs.container).find(".knob-tooltip");
  tooltip.text(`${mapToPercentage(panValue, rs)}`);

  gate.roundSlider("setValue", gateValue);
  rs = gate.data("roundSlider");
  tooltip = $(rs.container).find(".knob-tooltip");
  tooltip.text(`${mapToPercentage(gateValue, rs)}`);
}

function unbindFXUI(loop) {
  const loopIndex = loop.getIndex();
  const nodes = loop.getFXTypes();

  for (let i = 0; i < nodes.length; i++) {
    const fxID = `#FX${loopIndex}-${i}`;
    let toRemove = [(fxID), (fxID + "-node"), (fxID + "-controls input"), (fxID + "-toggle")];

    $(document).off("click", toRemove[1]);
    $(document).off("valueChange", fxID + "-controls .slider");
    $(document).off("click", toRemove[3]);

    if (nodes[i] == 'amp') {
      $(document).off("click", fxID + "-channel");
      toRemove.push(fxID + "-channel");
    } else if (nodes[i] == 'cab') {
      $(document).off("click", fxID + "-ir");
      toRemove.push(fxID + "-ir");

      $(document).off("click", fxID + "-ir2");
      toRemove.push(fxID + "-ir2");
    } else if (nodes[i] == 'eq') {
      $(document).off("click", fxID + "-eq");
      toRemove.push(fxID + "-eq");
    }

    toRemove.forEach(id => {
      const idx = boundedListeners.indexOf(id);
      if (idx != -1) {
        boundedListeners.splice(idx, 1);
      }
    });
  }
}

function updateFXControls(loop, type, index, values) {
  let id = 0;
  const fxID = `#FX${loop.getIndex()}-${index}-`;

  changeToggleButton(fxID, values[0]);
  if (values[0] == 0) {
    $(`${fxID}toggle`).attr('aria-pressed', "false");
  }

  if (type == 'amp') {
    if (values[1] == 1) {
      $(`${fxID}channel`).attr('aria-pressed', "true");
    }

    values.splice(0, 2);
    const m1 = values.splice(5, 1);
    const m2 = values.pop();

    values.push(m1);
    values.push(m2);

  } else if (type == 'cab') {
    const selected = cabinetsIR.find(ir => ir.name === values[1]);
    loop.setBuffer(index, selected.buffer, selected.name);

    // loop.setBuffer(index, irBuffers[irName], getIRKey(irList[irName]));
    // $(`#FX${loop.getIndex()}-${index}-ir`).val(irName);

    values.splice(0, 2);
  } else if (type == 'flg') {
    values.shift();
  } else if (type == 'swc') {
    if (values[1] == 1) {
      $(`${fxID}mode`).attr('aria-pressed', "true");
    }

    const activeButton = values[2];
    $(`${fxID}controls`).find(`.${activeButton}-button`).attr('data-active', "true");
    const routes = ["A", "B", "C", "D"];
    // $(`#FX${loop.getIndex()}-${i}-controls`).find('.current-route').html(nodes[i].setCurrentRouteName());
    $(`#FX${loop.getIndex()}-${index}-controls`).find('.current-route').html(values[4][routes.indexOf(values[2])]);
    
  } else if (type == 'vol') {

  } else {
    // values.shift();
  }

  while ($(fxID + id).length > 0) {
    const element = $(fxID + id);

    if (element.hasClass("slider")) {
      const sliderValue = values[id];
      if (sliderValue !== undefined) {
        element.roundSlider("setValue", sliderValue);
        const rs = element.data("roundSlider");
        const tooltip = $(rs.container).find(".knob-tooltip");
        tooltip.text(`${mapToPercentage(sliderValue, rs)}`);
      }
    }

    id ++;
  }
}

function mapToPercentage(value, rs) {
  const min = rs.options.min;
  const max = rs.options.max;
  const percent = ((value - min) / (max - min)) * 100;
  return Math.round(percent);
}

function initializeSliders(loop, index) {
  let id = 0;
  const fxID = `#FX${loop.getIndex()}-${index}-`;
  
  if (loop.getNodeType(index) == 'eq') {
    if (!boundedListeners.includes(fxID + 'eq')) {
      while ($(fxID + id).length > 0) {
        const thisInput = `${fxID}${id}`;
        $(document).on('input', thisInput, function(e, data) {
          const vals = getValuesFrom(`FX${loop.getIndex()}-${index}-controls`);
          // loop.setParams(index, vals);
          manager.setParams(loop.getIndex(), index, vals);
        });
        
        id ++;
      }

      boundedListeners.push(fxID + 'eq');
    }  

    return;
  }

  while ($(fxID + id).length > 0) {
    const element = $(fxID + id);
    const valID = element.attr('id').split('-')[2];

    // get range values
    const val = parseFloat(element.val());
    const minVal = parseFloat(element.data("min"));
    const maxVal = parseFloat(element.data("max"));
    let stepVal = 0.01;
    if (element.data('step')) {
      stepVal = parseFloat(element.data('step'));
      // console.log(minVal, maxVal, stepVal);
    } else {
      stepVal = maxVal / 1000;
    }

    const rs = element.roundSlider({
      radius: 24,
      sliderType: "min-range",
      width: 4,
      handleShape: "square",
      lineCap: "square",
      circleShape: "pie",
      showTooltip: false,
      editableTooltip: false,
      // startAngle: 270,
      startAngle: 314,
      handleSize: "10, 3",
      min: minVal,
      max: maxVal,
      step: stepVal,
      value: val,
      animation: false,
      drag: function (e) {
        tooltip.text(`${mapToPercentage(e.value, rs)}`);
        $(element).trigger('valueChange', { value: e.value, index: valID });
      },
      change: function (e) {
        tooltip.text(`${mapToPercentage(e.value, rs)}`);

        $(element).trigger('valueChange', { value: e.value, index : valID });
      }
    }).data("roundSlider");

    const tooltip = $('<div class="knob-tooltip"></div>').appendTo($(rs.container));
    tooltip.text(`${mapToPercentage(rs.getValue(), rs)}`).hide();

    $(rs.container).on("mouseenter mousedown", () => {
      tooltip.fadeIn(150);
    });
    $(rs.container).on("mouseleave mouseup", () => {
      tooltip.fadeOut(150);
    });
    $(rs.container).on("wheel", (e) => {
      tooltip.fadeIn(0);
      e.preventDefault();
  
      let value = rs.getValue();
      const sens = 15;
    
      if (e.originalEvent.deltaY < 0) {
        value = Math.min(rs.options.max, value + rs.options.step * sens);
      } else {
        value = Math.max(rs.options.min, value - rs.options.step * sens);
      }
    
      rs.setValue(value);
      tooltip.text(`${mapToPercentage(value, rs)}`);
      $(element).trigger('valueChange', { value: value, index: valID });
    });
    
    $(`${fxID}controls .rs-inner-container .rs-range-color`).each(function () {
      this.style.setProperty('background-color', loop.color, 'important');
    });

    id ++;
  }
}

function updateSliderColors(loopIndex, color) {
  const fontColor = getFontColorForBg(color) == 1 ? "black" : "white";
  $(`#Loop-${loopIndex}`).find(".loop-header").attr("style", `background-color: ${color}!important; color: ${fontColor}!important`);

  loopModal.find('.fx-header').attr("style", `background-color: ${color}!important`);
  $("#loopname").attr("style", `color: ${fontColor}!important`);

  $(`#Loop-${loopIndex} .rs-inner-container .rs-range-color`).each(function () {
    this.style.setProperty('background-color', color, 'important');
  });

  const size = manager.getSizeOfElements(loopIndex);
  for (let i = 0; i < size; i++) {
    $(`#FX${loopIndex}-${i}-controls`).find(".fx-banner").attr("style", `background-color: ${color}!important; color: ${fontColor}`);

    $(`#FX${loopIndex}-${i}-controls .rs-inner-container .rs-range-color`).each(function () {
      this.style.setProperty('background-color', color, 'important');
    });
  }
}

function initalizeLoopSlider(index) {
  const fxID = `#FX${index}-`;
  const input = $(fxID + 'input');
  const pan = $(fxID + 'pan');
  const gate = $(fxID + 'gate');

  const minVal1 = input.data("min");
  const maxVal1 = input.data("max");
  const stepVal1 = input.data("step");

  const minVal2 = pan.data("min");
  const maxVal2 = pan.data("max");
  const stepVal2 = pan.data("step");

  const minVal3 = gate.data("min");
  const maxVal3 = gate.data("max");
  const stepVal3 = gate.data("step");

  const rs = input.roundSlider({
    radius: 24,
    sliderType: "min-range",
    width: 4,
    handleShape: "square",
    lineCap: "square",
    circleShape: "pie",
    showTooltip: false,
    editableTooltip: false,
    // startAngle: 270,
    startAngle: 314,
    handleSize: "10, 3",
    min: minVal1,
    max: maxVal1,
    step: stepVal1 != null ? stepVal1 : maxVal1 / 1000,
    value: 5,
    animation: false,
    drag: function (e) {
      tooltip.text(`${mapToPercentage(e.value, rs)}`);
      $(input).trigger('valueChange', { value: e.value });
    },
    change: function (e) {
      tooltip.text(`${mapToPercentage(e.value, rs)}`);
      $(input).trigger('valueChange', { value: e.value });
    }
  }).data("roundSlider");

  const tooltip = $('<div class="knob-tooltip input-knob"></div>').appendTo($(rs.container));
  tooltip.text(`${mapToPercentage(rs.getValue(), rs)}`).hide();

  $(rs.container).on("mouseenter mousedown", () => {
    tooltip.fadeIn(150);
  });
  $(rs.container).on("mouseleave mouseup", () => {
    tooltip.fadeOut(150);
  });
  $(rs.container).on("wheel", (e) => {
    tooltip.fadeIn(0);
    e.preventDefault();

    let value = rs.getValue();
    const sens = 15;
  
    if (e.originalEvent.deltaY < 0) {
      value = Math.min(rs.options.max, value + rs.options.step * sens);
    } else {
      value = Math.max(rs.options.min, value - rs.options.step * sens);
    }
  
    rs.setValue(value);
    tooltip.text(`${mapToPercentage(value, rs)}`);
    $(input).trigger('valueChange', { value: value });
  });

  const rs2 = pan.roundSlider({
    radius: 24,
    sliderType: "default",
    width: 4,
    handleShape: "square",
    lineCap: "square",
    circleShape: "pie",
    showTooltip: false,
    editableTooltip: false,
    // startAngle: 270,
    startAngle: 314,
    handleSize: "10, 3",
    min: minVal2,
    max: maxVal2,
    step: stepVal2 != null ? stepVal2 : maxVal2 / 1000,
    value: 5,
    animation: false,
    drag: function (e) {
      tooltip2.text(`${mapToPercentage(e.value, rs2)}`);
      $(pan).trigger('valueChange', { value: e.value });
    },
    change: function (e) {
      tooltip2.text(`${mapToPercentage(e.value, rs2)}`);
      $(pan).trigger('valueChange', { value: e.value });
    }
  }).data("roundSlider");

  const tooltip2 = $('<div class="knob-tooltip input-knob"></div>').appendTo($(rs2.container));
  tooltip2.text(`${mapToPercentage(rs2.getValue(), rs2)}`).hide();

  $(rs2.container).on("mouseenter mousedown", () => {
    tooltip2.fadeIn(150);
  });
  $(rs2.container).on("mouseleave mouseup", () => {
    tooltip2.fadeOut(150);
  });
  $(rs2.container).on("wheel", (e) => {
    tooltip2.fadeIn(0);
    e.preventDefault();

    let value = rs2.getValue();
    const sens = 15;
  
    if (e.originalEvent.deltaY < 0) {
      value = Math.min(rs2.options.max, value + rs2.options.step * sens);
    } else {
      value = Math.max(rs2.options.min, value - rs2.options.step * sens);
    }
  
    rs2.setValue(value);
    tooltip2.text(`${mapToPercentage(value, rs2)}`);
    $(pan).trigger('valueChange', { value: value });
  });

  const rs3 = gate.roundSlider({
    radius: 24,
    sliderType: "min-range",
    width: 4,
    handleShape: "square",
    lineCap: "square",
    circleShape: "pie",
    showTooltip: false,
    editableTooltip: false,
    // startAngle: 270,
    startAngle: 313,
    handleSize: "10, 3",
    min: minVal3,
    max: maxVal3,
    step: stepVal3 != null ? stepVal3 : maxVal3 / 1000,
    value: 5,
    animation: false,
    drag: function (e) {
      tooltip2.text(`${mapToPercentage(e.value, rs3)}`);
      $(gate).trigger('valueChange', { value: e.value });
    },
    change: function (e) {
      tooltip2.text(`${mapToPercentage(e.value, rs3)}`);
      $(gate).trigger('valueChange', { value: e.value });
    }
  }).data("roundSlider");

  const tooltip3 = $('<div class="knob-tooltip input-knob"></div>').appendTo($(rs3.container));
  tooltip3.text(`${mapToPercentage(rs3.getValue(), rs3)}`).hide();

  $(rs3.container).on("mouseenter mousedown", () => {
    tooltip3.fadeIn(150);
  });
  $(rs3.container).on("mouseleave mouseup", () => {
    tooltip3.fadeOut(150);
  });
  $(rs3.container).on("wheel", (e) => {
    tooltip3.fadeIn(0);
    e.preventDefault();

    let value = rs3.getValue();
    const sens = 15;
  
    if (e.originalEvent.deltaY < 0) {
      value = Math.min(rs3.options.max, value + rs3.options.step * sens);
    } else {
      value = Math.max(rs3.options.min, value - rs3.options.step * sens);
    }
  
    rs3.setValue(value);
    tooltip3.text(`${mapToPercentage(value, rs3)}`);
    $(gate).trigger('valueChange', { value: value });
  });
}

function initSpectrumSliders() {
  const specMinDb = $("#spec_minDb");
  const specMaxDb = $("#spec_maxDb");

  const minVal1 = specMinDb.data("min");
  const maxVal1 = specMinDb.data("max");
  const stepVal1 = specMinDb.data("step");
  const minVal2 = specMaxDb.data("min");
  const maxVal2 = specMaxDb.data("max");
  const stepVal2 = specMaxDb.data("step");

  const rs = specMinDb.roundSlider({
    radius: 18,
    sliderType: "default",
    width: 4,
    handleShape: "square",
    lineCap: "square",
    circleShape: "pie",
    showTooltip: false,
    editableTooltip: false,
    // startAngle: 270,
    startAngle: 314,
    handleSize: "10, 3",
    min: minVal1,
    max: maxVal1,
    step: stepVal1,
    value: -60,
    animation: false,
    drag: function (e) {
      $(specMinDb).trigger('valueChange', { value: e.value });
    },
    change: function (e) {
      $(specMinDb).trigger('valueChange', { value: e.value });
    }
  }).data("roundSlider");

  $(rs.container).on("wheel", (e) => {
    e.preventDefault();

    let value = rs.getValue();
    const sens = 2;
    const maxVal = parseInt($("#spec_maxDb").val());
    
    if (e.originalEvent.deltaY < 0) {
      value = Math.min(rs.options.max, value + rs.options.step * sens);
    } else {
      value = Math.max(rs.options.min, value - rs.options.step * sens);
    }  

    if (value >= maxVal) {
      value = maxVal - 6;
    }
    
    rs.setValue(value);
    $(specMinDb).trigger('valueChange', { value: value });
  });

  $(document).on('valueChange',  "#spec_minDb", function(e, data) {
    if (!data)
      return;

    $(".min-spec").html((data.value < 0 ? (data.value) : ('+' + data.value)));
    const maxDb = parseInt($("#spec_maxDb").val());
    const loopIndex = spectrumCard.data('id');
    manager.setSpectrumY(loopIndex, data.value, maxDb);
  });

  // max

  const rs2 = specMaxDb.roundSlider({
    radius: 18,
    sliderType: "default",
    width: 4,
    handleShape: "square",
    lineCap: "square",
    circleShape: "pie",
    showTooltip: false,
    editableTooltip: false,
    // startAngle: 270,
    startAngle: 314,
    handleSize: "10, 3",
    min: minVal2,
    max: maxVal2,
    step: stepVal2,
    value: +20,
    animation: false,
    drag: function (e) {
      $(specMaxDb).trigger('valueChange', { value: e.value });
    },
    change: function (e) {
      $(specMaxDb).trigger('valueChange', { value: e.value });
    }
  }).data("roundSlider");

  $(rs2.container).on("wheel", (e) => {
    e.preventDefault();

    let value = rs2.getValue();
    const sens = 2;
    const minVal = parseInt($("#spec_minDb").val());

    if (e.originalEvent.deltaY < 0) {
      value = Math.min(rs2.options.max, value + rs2.options.step * sens);
    } else {
      value = Math.max(rs2.options.min, value - rs2.options.step * sens);
    }  

    if (value <= minVal) {
      value = minVal + 6;
    }
    
    rs2.setValue(value);
    $(specMaxDb).trigger('valueChange', { value: value });
  });

  $(document).on('valueChange',  "#spec_maxDb", function(e, data) {
    if (!data)
      return;

    $(".max-spec").html((data.value < 0 ? (data.value) : ('+' + data.value)));
    const minDb = parseInt($("#spec_minDb").val());
    const loopIndex = spectrumCard.data('id');

    manager.setSpectrumY(loopIndex, minDb, data.value);
  });
}

function updateInputMeterForLoop(loop) {
  const inputMeter  = $(`#loop-${loop.getIndex()}-input`);
  const outputMeter = $(`#loop-${loop.getIndex()}-master`);

  const {rms: rms1, max, min} = loop.getLevel("input");
  const {rms: rms2, max: max2, min: min2} = loop.getLevel("output");

  const boostedRms1 = Math.pow(rms1, 0.5);
  const boostedRms2 = Math.pow(rms2 < 0.01 ? 0 : rms2, 0.5);

  const level1 = Math.min(100, Math.floor(boostedRms1 * 100));
  const level2 = Math.min(100, Math.floor(boostedRms2 * 100));

  inputMeter.css('height', `${level1}%`);
  outputMeter.css('height', `${level2}%`);

  requestAnimationFrame(() => updateInputMeterForLoop(loop));
}

function updateButtons(loop, index) {
  const playButton = $(`#Loop-${index} #play`);
  const muteButton  = $(`#Loop-${index} #mute`);
  const recordButton  = $(`#Loop-${index} #rec`);
  const loopButton  = $(`#Loop-${index} #loop`);
  const soloButton  = $(`#Loop-${index} #solo`);
  const loadButton  = $(`#Loop-${index} #loadAudio`);

  $(`#Loop-${index} .rs-inner-container .rs-range-color`).each(function () {
    this.style.setProperty('background-color', loop.color, 'important');
  });
  
  if (loop.isPlaying == true) {
    playButton.html("Stop");
    playButton.addClass('play-btn');
  } else {
    playButton.html("Play");
    playButton.removeClass('play-btn');
  }

  if (loop.isRecording == true) {
    recordButton.addClass('mute-on');
  } else {
    recordButton.removeClass('mute-on');
  }

  if (loop.muted == true) {
    muteButton.addClass('mute-on');
  } else {
    muteButton.removeClass('mute-on');
  }

  if (loop.loopAudio == true) {
    loopButton.addClass("loop-on");
  } else {
    loopButton.removeClass("loop-on");
  }
  
  if (loop.solo == true) {
    soloButton.addClass("solo-on");
  } else {
    soloButton.removeClass("solo-on");
  }

  if (loop.buffer == null) {
    loadButton.addClass("load-on");
  } else {
    loadButton.removeClass("load-on");
  }
}

function startMeterWatcher(interval = 200) {
  setInterval(() => {
    $(".meter-fill").each(function() {
      const height = parseFloat($(this).css('height')) / $(this).parent().height() * 100;
      
      $(this).css("background", "var(--fx_green)");
      if (height > 60) {
        $(this).css("background", "var(--fx_yellow)");
      } 
      if (height > 85) {
        $(this).css("background", "var(--fx_red)");
      }

    });
  }, interval);
}

function updateVisibleFX(list) {
  list.children().each(function() {
    const fxID = $(this).attr('id').split("controls")[0];

    if (visibleFX.includes(fxID)) {
      $(this).removeClass("hide");
    } else {
      $(this).addClass("hide");
    }
  });

  updateJustifyContent();
}

function displayOnlyFXLoop(index) {
  fxListElemt.children().toArray().forEach(el => {
    const element = $(el);
    const loopId = element.attr('id').split('FX')[1].split('-')[0];
    if (loopId != index) {
      element.addClass("hide");
    } else {
      element.removeClass("hide");
    }
  });

  updateJustifyContent();
}

function displayOnly(loopIndex, nodeIndex) {

  fxListElemt.children().toArray().forEach(el => {
    const element = $(el);
    const loopId = element.attr('id').split('FX')[1].split('-')[0];
    const nodeId = element.attr('id').split('-')[1];

    if (loopId != loopIndex) {
      element.addClass("hide");
    } else {
      if (nodeId != nodeIndex) {
        element.addClass("hide");
      } else if (nodeId == nodeIndex) {
        element.removeClass("hide");
      }
    }
  });
}

function getRandomHexColor() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

function getFontColorForBg(hexColor) {
  if (hexColor == null || hexColor.includes("var(")) {
    return 1;
  }

  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  // Apply gamma correction
  const [R, G, B] = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

  // Contrast ratio with white and black
  const whiteContrast = (1.05) / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;

  return blackContrast > whiteContrast ? 1 : 0;
}

function audioBufferToWav(audioBuffer) {
  const numOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bufferLength = audioBuffer.length;
  const buffer = new ArrayBuffer(44 + bufferLength * numOfChannels * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength * numOfChannels * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChannels * 2, true);
  view.setUint16(32, numOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength * numOfChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < numOfChannels; i++) {
    const channelData = audioBuffer.getChannelData(i);
    for (let j = 0; j < bufferLength; j++) {
      const sample = channelData[j] * 32767;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return buffer;
}

function audioBufferToBlob(audioBuffer) {
  return new Promise((resolve, reject) => {
      const offlineContext = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
      );
      
      const bufferSource = offlineContext.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(offlineContext.destination);
      
      bufferSource.start();
      offlineContext.startRendering().then(renderedBuffer => {
          const wav = audioBufferToWav(renderedBuffer);
          const blob = new Blob([wav], { type: 'audio/wav' });
          resolve(blob);
      }).catch(error => {
          reject(error);
      });
  });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
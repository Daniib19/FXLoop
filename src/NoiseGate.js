/// <reference path="../FX.js" />

/**
 * @class
 * @extends FXNode
 */

class NoiseGate extends FXNode {
  /**
  * @param {AudioContext} audioContext
  */

  constructor(audioContext, sharedAnalyser = null) {
    super(audioContext, "Noise Gate", "gate");

    this.threshold = -20;
    this.attackTime = 0.1;
    this.releaseTime = 0.4;
    this.isGateOpen  = true;
    this.analyser = this.context.createAnalyser();
    this.gateGain = this.context.createGain();

    this.setSubType("gate");
    this.update = this.update.bind(this);
    this.gateGain.gain.value = 1;

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    this.makeConnections();
    this.update();
  }

  makeConnections() {
    // main route
    this.input.connect(this.gateGain);
    this.gateGain.connect(this.analyser);
    this.analyser.connect(this.outputGain);
    this.outputGain.connect(this.output);

    // bypass
    this.input.connect(this.bypass);
    this.bypass.connect(this.output);
  }

  getLevel() {
    if (!this.analyser) return;

    let bufferLength = this.analyser.frequencyBinCount;
    let darr = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(darr);

    let sum = 0;
    let min = 255;
    let max = 0;

    for (let i = 0; i < bufferLength; i++) {
        const val = darr[i];
        const normalized = (val - 128) / 128;

        sum += normalized * normalized;
        if (val < min) min = val;
        if (val > max) max = val;
    }

    const rms = Math.sqrt(sum / bufferLength);
    return rms;
  }

  scheduleGainChange(targetGain, transitionTime) {
    const now = this.context.currentTime;
    this.gateGain.gain.cancelScheduledValues(now);
    this.gateGain.gain.setValueAtTime(this.gateGain.gain.value, now);
    this.gateGain.gain.linearRampToValueAtTime(targetGain, now + transitionTime);
  }

  update() {
    if (!this.analyser) return;
  
    const level = this.getLevel(); // RMS from getLevel()
    const gateThreshold = Math.pow(10, this.threshold / 20); // dB to linear
    const openThreshold = gateThreshold;
    const closeThreshold = gateThreshold * 0.8;
  
    // Smoothing the level
    this.smoothedLevel = this.smoothedLevel ?? 0;
    this.smoothedLevel = 0.9 * this.smoothedLevel + 0.1 * level;
  
    const now = this.context.currentTime;
  
    this.isGateOpen = this.isGateOpen ?? false;
  
    if (this.smoothedLevel > openThreshold && !this.isGateOpen) {
      this.scheduleGainChange(1, this.attackTime);
      this.isGateOpen = true;
    } else if (this.smoothedLevel < closeThreshold && this.isGateOpen) {
      this.scheduleGainChange(0, this.releaseTime);
      this.isGateOpen = false;
    }
  
    console.log(`Level: ${this.smoothedLevel.toFixed(4)}, Gate: ${this.isGateOpen ? 'open' : 'closed'}`);
  
    requestAnimationFrame(() => this.update());
  }

  getParams() {
    return [
      this.threshold,
      this.attackTime,
      this.releaseTime,
    ];
  }

  setParams(vals) {
    for (let i = 0; i < vals.length; i++) {
      vals[i] = parseFloat(vals[i]);
    }

    this.threshold = vals[0];
    this.attackTime = vals[1];
    this.releaseTime = vals[2];
  }

  render(loopIndex, nodeIndex) {
    const vals = this.getParams();

    return `
      <div class="fx-control-container">
        <div class="fx-section" style="margin-top: 10px"></div>
        <div class="fx-grid">
          <div class="fx-knob">
            <input class="slider" id="FX${loopIndex}-${nodeIndex}-0" type="text" value="${vals[0]}" data-min="-80" data-max="0" data-step="0.25"/>
            <label>Threshold</label>
          </div>
          <div class="fx-knob">
            <input class="slider" id="FX${loopIndex}-${nodeIndex}-1" type="text" value="${vals[1]}" data-min="0.001" data-max="0.1"/>
            <label>Attack</label>
          </div>
          <div class="fx-knob">
            <input class="slider" id="FX${loopIndex}-${nodeIndex}-2" type="text" value="${vals[2]}" data-min="0.05" data-max="1.0"/>
            <label>Release</label>
          </div>
        </div>
      </div>
    `;
  }
}
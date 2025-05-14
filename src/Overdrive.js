/// <reference path="../FX.js" />

/**
 * @class
 * @extends FXNode
 */

class Overdrive extends FXNode {
  /**
  * @param {AudioContext} audioContext
  */

  constructor(audioContext) {
    super(audioContext, "Overdrive", "od");
    
    this.disto = this.context.createWaveShaper();
    this.lowPass = this.context.createBiquadFilter();

    // default values
    this.disto.curve = this.makeDistoCurve();
    this.lowPass.type = "lowshelf"
    this.lowPass.frequency.value = 750;

    this.inputGain.gain.value = 1;
    this.lowPass.gain.value = 5;
    this.outputGain.gain.value = 1;

    this.makeConnections();
  }

  makeConnections() {
    // Main route
    this.input.connect(this.inputGain);
    this.inputGain.connect(this.disto);
    this.disto.connect(this.lowPass);
    this.lowPass.connect(this.outputGain);
    this.outputGain.connect(this.output);

    // Bypass
    this.input.connect(this.bypass);
    this.bypass.connect(this.output);
  }

  makeDistoCurve(amount = 350) {
    const curve = new Float32Array(48000);
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / curve.length - 1;
      curve[i] = Math.tanh(amount * x);
    }

    return curve;
  }

  loadPreset(preset) {
    if (preset[0] == 0 || preset[0] == false)
      this.toggle();

    this.setParams(preset.splice(1));
  }

  setParams(vals) {
    this.inputGain.gain.value = vals[0];
    this.lowPass.gain.value = vals[1];
    this.outputGain.gain.value = vals[2];
  }

  getParams() {
    return [
      this.activated,
      this.inputGain.gain.value,
      this.lowPass.gain.value,
      this.outputGain.gain.value,
    ];
  }
}
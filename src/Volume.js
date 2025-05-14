/// <reference path="../FX.js" />

/**
 * @class
 * @extends FXNode
 */

class VolumeFX extends FXNode {
  constructor(audioContext) {
    super(audioContext, "Volume Boost", "vol");

    this.makeConnections();
  }

  setParams(vals) {
    let val;
    if (vals.length == 1) {
      val = vals[0];
    }

    this.outputGain.gain.value = val;
  }

  loadPreset(preset) {
    if (preset[0] == 0) {
      this.toggle();
    }

    preset.splice(1);
    this.setParams(preset);
    console.log(preset);
  }

  getParams() {
    return [
      this.activated,
      this.outputGain.gain.value
    ];
  }
}
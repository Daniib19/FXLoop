/**
 * @extends {FXNode}
 */

class FXPatch extends FXNode {
    /**
     * 
     * @param {AudioContext} audioContext 
     */

  constructor(audioContext) {
    super(audioContext, "Patch FX", "swc");

    this.currentPreset = "Empty";
    this.active = "";
    // this.presets = ["0-0", "0-1", "0-2", "0-1"];
    this.presets = ["", "", "", ""];
    this.presetNames = ["", "", "", ""];
    this.routes = ["A", "B", "C", "D"];
    this.mode = 0;
 
    this.makeConnections();
  }

  toggleChannel() {
    this.mode = !this.mode;
  }

  getCurrentRoute() {
    return this.currentPreset;
  }

  setCurrentRouteName(name) {
    this.currentPreset = name;
  }

  getRouteNames() {
    return this.routes;
  }

  setRoute(route, preset, presetName) {
    this.presets[this.routes.indexOf(route)] = preset;
    this.presetNames[this.routes.indexOf(route)] = presetName;
  }

  hasRoute(index) {
    return this.presets[index] != "";
  }

  getRoute(index) {
    return this.presets[index];
  }

  addActive(index) {
    this.active = this.routes[index];
    this.currentPreset = this.presetNames[index];
  }

  setParams(vals) {
    this.active = vals[0];
    this.presets = vals[1];
    this.presetNames = vals[2];
    this.currentPreset = this.presetNames[this.routes.indexOf(this.active)];
  }

  loadPreset(preset) {
    if (preset[0] == 0) {
      this.toggle();
    }

    if (preset[1] == 1) {
      this.toggleChannel();
    }

    preset.splice(0, 2);
    this.setParams(preset);
  }

  getParams() {
    let arr = [this.activated];
    arr.push(this.mode);
    arr.push(this.active);
    arr.push(this.presets);
    arr.push(this.presetNames);

    return arr;
  }
}
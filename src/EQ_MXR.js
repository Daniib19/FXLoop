/**
 * @extends {EQ}
 */

class EQ_MXR extends EQ {
  constructor(audioContext) {
    super(audioContext, "Equalizer 10Band");
    this.setSubType("eq_mxr");

    this.removeFilters();
    [62, 125, 250, 500, 1000, 2000, 4000, 8000, 10000, 16000].forEach((freq, i) => {
      this.addFilter(freq);
    });
  }
}
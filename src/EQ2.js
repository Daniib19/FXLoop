class EQ extends FXNode {
    constructor(audioContext, name = "Equalizer", type = "eq") {
        super(audioContext, name, type);

        this.filterFreq = [];
        this.filters = [];
        this.size = 0;
        this.gain = 12; // RANGE : (-12, 0, +12)

        [60, 170, 350, 1000, 3500, 10000].forEach((freq, i) => {
            this.filterFreq.push(freq);
            let eq = context.createBiquadFilter();
            eq.type = "peaking";
            eq.frequency.value = freq;
            eq.gain.value = 0;

            this.filters[i] = eq;
            this.size ++;
        });

        this.makeConnections();
    }

    removeFilters() {
        if (this.size == 0) return;

        this.disconnectFilters();

        this.filterFreq = [];
        this.filters = [];
        this.size = 0;
    }

    disconnectFilters() {
        if (this.size == 0) return;

        this.inputGain.disconnect(this.filters[0]);

        for (let i = 0; i < this.size - 1; i++) {
            this.filters[i].disconnect(this.filters[i + 1]);
        }

        this.filters[this.size - 1].disconnect();
    }

    connectFilters() {
        // this.disconnectFilters();

        this.input.connect(this.inputGain);
        this.inputGain.connect(this.filters[0]);
        for (let i = 0; i < this.size - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
        this.filters[this.size - 1].connect(this.outputGain);
    }

    makeConnections() {
        if (this.size == 0) return;
        
        // main channel
        this.input.connect(this.inputGain);
        this.inputGain.connect(this.filters[0]);
        for (let i = 0; i < this.size - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
        this.filters[this.size - 1].connect(this.outputGain);
        this.outputGain.connect(this.output);

        // bypass
        this.input.connect(this.bypass);
        this.bypass.connect(this.output);
    }

    isBigger(a, b) {
        if (a.frequency.value < b.frequency.value)
            return -1;
        else
            return 1;

        return 0;
    }

    addFilter(freq) {
        let band = context.createBiquadFilter();
        band.type = "peaking";
        band.frequency.value = freq;
        band.gain.value = 0;

        this.disconnectFilters();

        this.filterFreq.push(freq);
        this.filterFreq.sort((a, b) => a - b);
        this.filters.push(band);
        this.filters.sort(this.isBigger);
        this.size ++;

        this.connectFilters();
    }

    getFreqs() {
        return this.filterFreq;
    }

    setGain(gain) {
        this.gain = gain;
    }

    getGain() {
        return this.gain;
    }

    getFilterGain(index) {
        return this.filters[index].gain.value;
    }

    changeGain(val, idx) {
        const value = parseFloat(val);
        this.filters[idx].gain.value = value;
    }

    setParams(vals) {
        for (let i = 0; i < vals.length; i++) {
            this.changeGain(vals[i], i);
        }
    }

    getParams() {
        let vals = [this.activated ? 1 : 0];
        this.filters.forEach(function (f, idx) {
            vals.push(f.gain.value);
        });

        return vals;
    }

    loadPreset(preset) {
        if (preset[0] == 0) this.toggle();
        preset.shift();
        this.setParams(preset);
    }

    // getPreset() {
    //     const values = this.getParams();
    //     return {
    //         type : this.type,
    //         name : this.name,
    //         values : values
    //     };
    // }
}
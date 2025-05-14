class Preamp extends FXNode {
    constructor(audioContext) {
        super(audioContext);

        this.gainLevel = [5, 5];

        this.low1 = this.context.createBiquadFilter();
        this.low2 = this.context.createBiquadFilter();
        this.high1 = this.context.createBiquadFilter();
        this.preamp1Gain = this.context.createGain();
        this.preamp2Gain = this.context.createGain();
        this.preamp1 = this.context.createWaveShaper();
        this.preamp2 = this.context.createWaveShaper();
        this.bassFilter = this.context.createBiquadFilter();
        this.midFilter = this.context.createBiquadFilter();
        this.trebleFilter = this.context.createBiquadFilter();
        this.presenceFilter = this.context.createBiquadFilter();

        // Default values
        this.low1.type = "lowshelf";
        this.low1.frequency.value = 720;
        this.low1.gain.value = -5;
        this.low2.type = "lowshelf";
        this.low2.frequency.value = 320;
        this.low2.gain.value = -5;
        this.high1.type = "highpass";
        this.high1.frequency.value = 6;
        this.high1.Q.value = 0.7;
        this.preamp1Gain.gain.value = 1;
        this.preamp2Gain.gain.value = 1;
        this.preamp1.curve = this.classicDistorsion(5);
        this.preamp2.curve = this.highDistorted(5);
        this.preamp1.oversample = "4x";
        this.preamp2.oversample = "4x";

        // TONESTACK
        this.bassFilter.frequency.value = 100;
        this.bassFilter.type = "lowshelf";
        this.bassFilter.Q.value = 0.7;
        this.midFilter.frequency.value = 1700;
        this.midFilter.type = "peaking";
        this.midFilter.Q.value = 0.7;
        this.trebleFilter.frequency.value = 6500;
        this.trebleFilter.type = "highshelf";
        this.trebleFilter.Q.value = 0.7;
        this.presenceFilter.frequency.value = 3900;
        this.presenceFilter.type = "peaking";
        this.presenceFilter.Q.value = 0.7;

        // this.makeConnections();
        this.defaultValues();
    }

    defaultValues() {
        this.setParams([5, 5, 0, 0, 9, 0, 1]);
    }

    classicDistorsion(k) {
        const n_samples = 44100;
        const deg = Math.PI / 180, i = 0;
        let curve = new Float32Array(n_samples);
        let x;

        for (let i = 0; i < n_samples; ++i) {
            x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 57 * deg / (Math.PI + k * Math.abs(x));
        }

        return curve;
    }

    highDistorted(a) {
        const samples = 48000 / 2;
        a = Math.pow(a + 2, 3);
        for (var c = new Float32Array(samples), d = 0; samples > d; d += 1) {
            var f = 2 * d / samples - 1;
            c[d] = (1 + a) * f / (1 + a * Math.abs(f));
        }

        return c;
    }

    makeConnections() {
        // Main Route
        this.input.connect(this.inputGain);
        this.inputGain.connect(this.low1);
        this.low1.connect(this.low2);
        this.low2.connect(this.preamp1Gain);
        this.preamp1Gain.connect(this.preamp1);
        this.preamp1.connect(this.high1);
        this.high1.connect(this.preamp2Gain);
        this.preamp2Gain.connect(this.preamp2);
        this.preamp2.connect(this.bassFilter);
        this.bassFilter.connect(this.midFilter);
        this.midFilter.connect(this.trebleFilter);
        this.trebleFilter.connect(this.presenceFilter);
        this.presenceFilter.connect(this.outputGain);
        this.outputGain.connect(this.output);

        // Bypass Route
        this.input.connect(this.bypass);
        this.bypass.connect(this.output);
    }

    setParams(vals, preset = false) {
        // DRIVE
        this.preamp1.curve = this.classicDistorsion(vals[0]);
        this.preamp2.curve = this.highDistorted(vals[1]);
        this.gainLevel = [vals[0], vals[1]];

        // TONE STACK

        // if (preset) {
        //     this.bassFilter.gain.value = (vals[2]);
        //     this.midFilter.gain.value = (vals[3]);
        //     this.trebleFilter.gain.value = (vals[4]);
        //     this.presenceFilter.gain.value = (vals[5]);
        // } else {
        //     this.bassFilter.gain.value = (vals[2] - 5) * 3;
        //     this.midFilter.gain.value = (vals[3] - 2) * 3;
        //     this.trebleFilter.gain.value = (vals[4] - 5) * 5;
        //     this.presenceFilter.gain.value = (vals[5] - 5) * 2;
        // }

        this.bassFilter.gain.value = (vals[2]);
        this.midFilter.gain.value = (vals[3]);
        this.trebleFilter.gain.value = (vals[4]);
        this.presenceFilter.gain.value = (vals[5]);

        // VOLUME
        this.outputGain.gain.value = vals[6];
        // console.log(vals);
    }

    getGain() {
        return this.gainLevel;
    }

    getParams() {
        return {
            "gain1": this.gainLevel[0],
            "gain2": this.gainLevel[1],
            "bass" : this.bassFilter.gain.value,
            "mids" : this.midFilter.gain.value,
            "treble" : this.trebleFilter.gain.value,
            "presence" : this.presenceFilter.gain.value,
            "master" : this.outputGain.gain.value
        }
    }

    getPreset() {
        return [
            this.gainLevel[0],
            this.gainLevel[1],
            this.bassFilter.gain.value,
            this.midFilter.gain.value,
            this.trebleFilter.gain.value,
            this.presenceFilter.gain.value,
            this.outputGain.gain.value
        ];
    }
}
class PreampClean extends Preamp {
    constructor(audioContext) {
        super(audioContext);

        this.preamp1.curve = this.superClean(5);
        this.preamp2.curve = this.crunch(5);
        this.volumeBoost = this.context.createGain();
        this.volumeBoost.gain.value = 2;

        this.gainLevel = 5;

        // this.makeConnections();
        this.defaultValues();
    }   

    defaultValues() {
        this.setParams([5, 0, 0, 9, 0, 1]);
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
        this.trebleFilter.connect(this.volumeBoost);
        this.volumeBoost.connect(this.outputGain);
        this.outputGain.connect(this.output);

        // Bypass Route
        this.input.connect(this.bypass);
        this.bypass.connect(this.output);
    }

    crunch(a) {
        a = Math.pow(a, 2);

        for (var c = new Float32Array(22050), d = 0; 22050 > d; d += 1) {
            var f = 2 * d / 22050 - 1;
            c[d] = (1 + a) * f / (1 + a * Math.abs(f));
        }

        return c;
    }

    superClean(a) {
        a = (a + 6) / 4;
        for (var c = new Float32Array(22050), d = 0; 22050 > d; d += 1) {
            var e = 2 * d / 22050 - 1;
            c[d] = (1 + a) * e / (1 + a * Math.abs(e));
        }
        return c;
    }

    setParams(vals, preset = false) {
        // DRIVE
        this.preamp1.curve = this.superClean(vals[0]);
        this.preamp2.curve = this.crunch(vals[0] / 1.2);
        this.gainLevel = vals[0];
        
        // TONE
        // presence -> (-10, 10)
        // bass     -> (-15, 15)
        // mids     -> ( -6, 24)
        // treble   -> (-25, 25)

        // if (preset) {
        //     this.presenceFilter.gain.value = (vals[1]);
        //     this.bassFilter.gain.value = (vals[2]);
        //     this.midFilter.gain.value = (vals[3]);
        //     this.trebleFilter.gain.value = (vals[4]);
        // } else {
        //     this.presenceFilter.gain.value = (vals[1] - 5) * 2;
        //     this.bassFilter.gain.value = (vals[2] - 5) * 3;
        //     this.midFilter.gain.value = (vals[3] - 2) * 3;
        //     this.trebleFilter.gain.value = (vals[4] - 5) * 5;
        // }
        this.presenceFilter.gain.value = (vals[1]);
        this.bassFilter.gain.value = (vals[2]);
        this.midFilter.gain.value = (vals[3]);
        this.trebleFilter.gain.value = (vals[4]);

        // VOLUME
        this.outputGain.gain.value = vals[5];
    }
    
    getParams() {
        return {
            "gain": this.gainLevel,
            "presence" : this.presenceFilter.gain.value,
            "bass" : this.bassFilter.gain.value,
            "mids" : this.midFilter.gain.value,
            "treble" : this.trebleFilter.gain.value,
            "master" : this.outputGain.gain.value
        }
    }

    getPreset() {
        return [
            this.gainLevel, 
            this.presenceFilter.gain.value,
            this.bassFilter.gain.value,
            this.midFilter.gain.value,
            this.trebleFilter.gain.value,
            this.outputGain.gain.value
        ];
    }
}
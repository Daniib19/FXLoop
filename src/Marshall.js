class Marshall extends FXNode {
    constructor(audioContext, rvbBuffer = null) {
        super(audioContext, "Amplificator", 'amp');
        // super(audioContext, "Marshall JCM800", 'amp');

        this.reverbActive = true;
        this.distoActive = false;

        // input -> canal 1 clean
        // disto -> canal 2 distortion

        // clean
        this.preampClean = new PreampClean(this.context);
        this.reverb = new Convolver(this.context, rvbBuffer);

        // disto channel
        this.distoGain = this.context.createGain();
        this.preamp = new Preamp(this.context);
        // this.poweramp = new Poweramp(this.context);
        // rip poweramp :(

        // default values - clean channel active
        this.preamp.makeConnections();
        this.preampClean.makeConnections();
        this.distoGain.gain.value = 0;

        this.makeConnections();
    }

    makeConnections() {
        // // clean connections
        this.input.connect(this.inputGain);
        this.inputGain.connect(this.preampClean.getInput());
        this.preampClean.connect(this.reverb.getInput());
        this.reverb.connect(this.outputGain);
        this.outputGain.connect(this.output);

        // disto connections
        this.input.connect(this.distoGain);
        this.distoGain.connect(this.preamp.getInput());
        this.preamp.connect(this.outputGain);

        // bypass route
        this.input.connect(this.bypass);
        this.bypass.connect(this.output);

        // toggle reverb cuz it aint workingg
        this.toggleReverb();
    }

    superClean(a) {
        a = (a + 6) / 4;
        for (var c = new Float32Array(22050), d = 0; 22050 > d; d += 1) {
            var e = 2 * d / 22050 - 1;
            c[d] = (1 + a) * e / (1 + a * Math.abs(e));
        }
        return c;
    }

    toggleReverb() {
        this.reverbActive = !this.reverbActive;
        this.reverb.toggle();
    }

    isReverbActive() {
        return this.reverbActive;
    }

    isChannelActive() {
        return this.distoActive;
    }

    loadReverb(buffer) {
        this.reverb.buffer = buffer;
    }

    toggleChannel() {
        if (!this.activated)
            return;

        this.distoActive = !this.distoActive;

        if (this.distoActive) {
            this.inputGain.gain.value = 0;
            this.distoGain.gain.value = 1;
        } else {
            this.inputGain.gain.value = 1;
            this.distoGain.gain.value = 0;
        }
    }

    setReverb(vals) {
        this.reverb.setParams(vals);
    }

    setParams(vals) {
        const preampC = vals.splice(0, 5);
        const preampD = vals.splice(0, 6);
        preampC.push(vals[0]);
        preampD.push(vals[1]);

        this.preampClean.setParams(preampC);
        this.preamp.setParams(preampD);
    }

    togglePowerAmp() {
        this.poweramp.toggle();
    }

    toggle() {
        this.activated = !this.activated;

        if (this.activated) {
            this.bypass.gain.setValueAtTime(0, this.context.currentTime);
            if (this.distoActive) {
                this.distoGain.gain.setValueAtTime(1, this.context.currentTime);
                this.inputGain.gain.setValueAtTime(0, this.context.currentTime);
            } else {
                this.distoGain.gain.setValueAtTime(0, this.context.currentTime);
                this.inputGain.gain.setValueAtTime(1, this.context.currentTime);
            }
        } else {
            this.inputGain.gain.setValueAtTime(0, this.context.currentTime);
            this.distoGain.gain.setValueAtTime(0, this.context.currentTime);
            this.bypass.gain.setValueAtTime(1, this.context.currentTime);
        }
    }

    // getParams() {
    //     const clean_channel = this.preampClean.getParams();
    //     const disto_channel = this.preamp.getParams();
    //     const reverb = this.reverb.getParams();

    //     return { clean_channel,  disto_channel, reverb };
    // }

    getParams() {
        const p1 = this.preampClean.getPreset();
        const p2 = this.preamp.getPreset();

        let arr = [this.activated == true ? 1 : 0];
        arr.push(this.distoActive == true ? 1 : 0);

        return [arr.concat(p1.concat(p2))];
    }
    
    loadPreset(preset) {
        if (preset[0] == 0) {
            this.toggle();
        }
        if (preset[1] == 1) {
            this.toggleChannel();
        }

        preset.splice(0, 2);
        const preampC = preset.splice(0, 6);
        const preampD = preset.splice(0, 7);

        this.preampClean.setParams(preampC);
        this.preamp.setParams(preampD);
    }

    getPreset() {
        const values = this.getParams();
        return {
            type : this.type,
            name : this.name,
            values : values
        };
    }
}
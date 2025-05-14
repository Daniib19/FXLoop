class Flanger extends FXNode {
    constructor(audioContext) {
        super(audioContext, 'Flanger', 'flg');

        this.delay = this.context.createDelay();
        this.lfo = this.context.createOscillator();
        this.lfoGain = this.context.createGain();
        this.feedback = this.context.createGain();
        this.mix = this.context.createGain();

        this.delay.delayTime.value = 0.005;
        this.feedback.gain.value = 0.5;
        this.outputGain.gain.value = 1.2;
        this.mix.gain.value = 1;

        this.makeConnections();
    }

    makeConnections() {
        // LFO setup
        this.lfo.type = "sine";
        this.lfo.frequency.value = 0.25;
        this.lfoGain.gain.value = 0.003;

        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.delay.delayTime);
        this.lfo.start();

        // Signal routing
        this.input.connect(this.inputGain);
        this.inputGain.connect(this.delay);
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);

        // Wet signal
        this.delay.connect(this.mix);
        this.mix.connect(this.outputGain);

        // Dry signal
        this.inputGain.connect(this.outputGain);
        this.outputGain.connect(this.output);

        // Bypass
        this.input.connect(this.bypass);
        this.bypass.connect(this.output);
    }

    setParams(vals) {
        this.lfo.frequency.value = vals[0];
        this.lfoGain.gain.value = vals[1];
        this.feedback.gain.value = vals[2];
        this.mix.gain.value = vals[3];
    }

    getParams() {
        let arr = [this.activated == true ? 1 : 0];
        arr.push(this.lfo.frequency.value);
        arr.push(this.lfoGain.gain.value);
        arr.push(this.feedback.gain.value);
        arr.push(this.mix.gain.value);
        
        return arr;
    }

    getPreset() {
        const values = this.getParams();
        return {
            type : this.type,
            name : this.name,
            values : values
        };
    }

    loadPreset(preset) {
        if (preset[0] == 0) {
            this.toggle();
        }

        this.setParams(preset.splice(1));
    }
}

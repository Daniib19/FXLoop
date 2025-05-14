// Convs IR -> both for cabinets and reverb

class Convolver extends FXNode {
    constructor(audioContext, buffer = null, buffName = null) {
        super(audioContext, "Convolver", "cab");
        this.gainLevel = 0.2;
        this.bufferName;

        this.directGain = this.context.createGain();
        this.conv = this.context.createConvolver();
        this.convGain = this.context.createGain();

        if (buffer) {
            this.setImpulse(buffer);
            this.bufferName = buffName;
        }

        // default values
        this.directGain.gain.value = 1;
        this.convGain.gain.value = 0;
        this.setParams([0.2, 1]);

        // main channel (wet)
        this.input.connect(this.inputGain);
        this.inputGain.connect(this.directGain);
        this.directGain.connect(this.conv);
        this.conv.connect(this.convGain);
        this.convGain.connect(this.outputGain);
        this.outputGain.connect(this.output);

        // bypass route (dry)
        this.input.connect(this.bypass);
        this.bypass.connect(this.output);
    }

    setImpulse(buffer, bufferName) {
        this.conv.buffer = buffer;
        this.bufferName = bufferName;
    }

    setParams(vals) {
        // mix dry and wet channels
        const v1 = Math.cos(vals[0] * Math.PI / 2);
        const v2 = Math.cos((1 - vals[0]) * Math.PI / 2);

        this.directGain.gain.value = v1;
        this.convGain.gain.value = v2;

        this.gainLevel = vals[0];
        this.outputGain.gain.value = vals[1];
    }

    getBufferName() {
        return this.bufferName;
    }

    getParams() {
        let arr = [this.activated == true ? 1 : 0];
        arr.push(this.bufferName);
        arr.push(0.2)
        return [arr.concat(this.outputGain.gain.value)];
    }

    normalizeBuffer(buffer) {
        const channels = buffer.numberOfChannels;
        for (let i = 0; i < channels; i++) {
            const data = buffer.getChannelData(i);
            const max = Math.max(...data.map(Math.abs));
            if (max > 0) {
                for (let j = 0; j < data.length; j++) {
                    data[j] /= max;
                }
            }
        }
    }

    loadPreset(preset) {
        if (preset[0] == false)
            this.toggle();

        this.bufferName = preset[1];
        this.setParams([preset[2], preset[3]]);
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
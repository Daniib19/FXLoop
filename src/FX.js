class FXNode {
    /**
     * 
     * @param {AudioContext} audioContext
     */
    constructor(audioContext, name = "FXNode", type = "fx") {
        this.context = audioContext;
        this.activated = true;
        this.name = name;
        this.type = type;
        this.subtype = "";
        
        this.input = this.context.createGain();
        this.inputGain = this.context.createGain();
        this.outputGain = this.context.createGain();
        this.output = this.context.createGain();
        this.bypass = this.context.createGain();

        // default vals
        this.inputGain.gain.value = 1;
        this.bypass.gain.value = 0;
    }

    makeConnections() {
        this.input.connect(this.inputGain);
        this.inputGain.connect(this.outputGain);
        this.outputGain.connect(this.output);

        // bypass route
        this.input.connect(this.bypass);
        this.bypass.connect(this.output);
    }

    toggle() {
        this.activated = !this.activated;

        if (this.activated == true) {
            this.inputGain.gain.value = 1;
            this.bypass.gain.value = 0;
        } else if (this.activated == false) {
            this.inputGain.gain.value = 0;
            this.bypass.gain.value = 1;
        }
    }

    isActive() {
        return this.activated;
    }

    connect(node) {
        this.output.connect(node);
    }

    disconnect(node = null) {
        if (node == null) {
            this.output.disconnect();
            return;
        }

        try {
            this.output.disconnect(node);
        } catch (e) {
            if (e.name !== "InvalidAccessError") throw e;
        }
    }

    setMaster(val) {
        this.outputGain.gain.value = val;
    }

    getInput() {
        return this.input;
    }

    setName(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    getType() {
        return this.type;
    }

    getSubType() {
        return this.subtype;
    }

    setSubType(type) {
        this.subtype = type;
    }

    setParams(vals) {
        //
    }

    loadPreset(preset) {
        if (preset[0] == 0)
            this.toggle();

        this.setParams(preset.shift());
    }

    getParams() {
        return [];
    }

    getPreset() {
        return {
            name: this.name,
            type: this.type,
            subtype: this.subtype,
            values: this.getParams()
        }
    }
}
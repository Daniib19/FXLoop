class FXLoop {
    /**
     * @param {AudioContext} audioContext
     * @type {FXNode[]}
     */
    fxNodes = []

    constructor(audioContext, name = "FXLoop" + index, index) {
        this.context = audioContext;
        this.fxNodes = [];
        this.name = name;
        this.color = 'var(--loop-header)';
        this.active = true;
        this.firstBuild = true;
        this.index = index;
        this.dataArray = [];
        this.outputArray = [];
        this.isGateOpen = true;
        this.gateThreshold = 0.01;
        this.gateAttack = 0.01;
        this.gateReleaseTime = 0.05;
        this._spectrumAnimationId = null;
        this.minDb = -24;
        this.maxDb =  12;
        this.minFreq = 1;
        this.maxFreq = 24000; // 48000 Hz / 2
        this.logMin = Math.log10(this.minFreq);
        this.logMax = Math.log10(this.maxFreq);

        this.input = this.context.createGain();
        this.inputGain = this.context.createGain();
        this.gateGain = this.context.createGain();
        this.inputAnalyser = this.context.createAnalyser();
        this.outputAnalyser = this.context.createAnalyser();
        this.bypass = this.context.createGain();
        this.output = this.context.createGain();
        this.panner = this.context.createStereoPanner();

        // default values
        this.inputGain.gain.value = 1;
        this.gateGain.gain.value = 1;
        this.bypass.gain.value = 0;
        this.panner.pan.value = 0;

        this.inputAnalyser.fftSize = 4096 * 4;
        this.dataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
        this.outputAnalyser.fftSize = 256;
        this.outputArray = new Uint8Array(this.outputAnalyser.frecquencyBinCount);

        this.buildChain();
        this.updateGate = this.updateGate.bind(this);
        this.updateGate();
    }
    
    setIndex(index) {
        this.index = index;
    }

    getIndex() {
        return this.index;
    }

    getNode(index) {
        return this.fxNodes[index];
    }

    getNodes() {
        return this.fxNodes;
    }

    setName(name) {
        this.name = name;
    }

    setFXName(index, name) {
        this.fxNodes[index].setName(name);
    }

    getFX(index) {
        return this.fxNodes[index];
    }

    getNodeType(index) {
        return this.fxNodes[index].type;
    }

    getName() {
        return this.name;
    }

    getInput() {
        return this.input;
    }

    getInputAnalyser() {
        return this.inputAnalyser;
    }

    getParams(index) {
        return this.fxNodes[index].getParams();
    }

    getPreset(index) {
        return this.fxNodes[index].getPreset();
    }

    loadLoop(loop) {
        console.log(loop);
    }

    loadFXPreset(index, preset) {
        this.fxNodes[index].loadPreset(preset);
    }

    getFXPreset(index) {
        return this.fxNodes[index].getPreset();
    }

    isActiveThis() {
        return this.active;
    }

    clearAll() {
        this.disconnectAll();
        this.fxNodes = [];
    }

    getSpectrumY() {
        return {
            min : this.minDb,
            max : this.maxDb
        };
    }

    setSpectrumX(min, max) {
        this.minFreq = Math.max(1, min);
        this.maxFreq = max;
        this.logMin = Math.log10(this.minFreq);
        this.logMax = Math.log10(this.maxFreq);
    
        if (this._spectrumDraw) {
            this._spectrumDraw();
        }
    }

    setSpectrumY(min, max) {
        this.minDb = min;
        this.maxDb = max;
    
        if (this._spectrumDraw) {
            this._spectrumDraw(); // Trigger redraw with new Y-axis limits
        }
    }
    
    startSpectrumAnalyzer(canvas, options = {}) {
        if (!canvas) return;
    
        const containerWidth = canvas.clientWidth;
        const containerHeight = canvas.clientHeight;
        const scale = window.devicePixelRatio || 2;
    
        canvas.width = containerWidth * scale;
        canvas.height = containerHeight * scale;
    
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = containerHeight + 'px';
    
        const ctx = canvas.getContext("2d");
        ctx.scale(scale, scale);
    
        const analyser = this.outputAnalyser;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const sampleRate = this.context.sampleRate;
    
        let animationId;
    
        const marginBottom = 40;
        const marginTop = 30;
        const marginLeft = 55;
        const marginRight = 10;
    
        const heightLimit = 0.8;
    
        const gridColor = "rgb(29, 29, 29)";
        const labelColor = "#faf7f7";
        const peakColor = "#bd0ef1";
        const referenceLevel = 192;
    
        const freqsToDraw = [
            0, 20, 30, 40, 50, 60, 80, 100,
            200, 300, 400, 500, 600, 800, 1000,
            2000, 3000, 4000, 5000, 6000, 8000, 10000, 24000
        ].filter(freq => freq >= this.minFreq && freq <= this.maxFreq);
    
        const peakHoldTime = 30;
        let peakValues = new Array(bufferLength).fill({ value: 0, holdTime: 0 });
    
        const dbScale = (value) => {
            const dB = 20 * Math.log10(value / referenceLevel || 1e-8);
            return Math.max(this.minDb, Math.min(this.maxDb, dB));
        };
    
        const xFromFreq = (freq) => {
            if (freq === 0) return marginLeft;
        
            const adjustedFreq = Math.max(this.minFreq, freq);
            const logFreq = Math.log10(adjustedFreq);
        
            const power = 2;
            const logNorm = (logFreq - this.logMin) / (this.logMax - this.logMin);
            const stretchedNorm = Math.pow(logNorm, power);
        
            return marginLeft + stretchedNorm * (containerWidth - marginLeft - marginRight);
        };
    
        const yFromDb = (dB) => {
            const usableHeight = containerHeight - marginTop - marginBottom;
            const limitedHeight = usableHeight * heightLimit;
            const norm = (dB - this.minDb) / (this.maxDb - this.minDb);
    
            return containerHeight - marginBottom - (norm * limitedHeight);
        };
    
        const calculateDbMarkers = () => {
            const range = this.maxDb - this.minDb;
            let step;
    
            if (range <= 36) step = 6;
            else if (range <= 72) step = 24;
            else step = 24;
    
            const markers = [];
            let current = Math.ceil(this.minDb / step) * step;
    
            while (current <= this.maxDb) {
                markers.push(current);
                current += step;
            }
    
            if (!markers.includes(this.minDb)) markers.unshift(this.minDb);
            if (!markers.includes(this.maxDb)) markers.push(this.maxDb);
    
            if (this.minDb < 0 && this.maxDb > 0 && !markers.includes(0)) {
                markers.push(0);
                markers.sort((a, b) => a - b);
            }
    
            return markers;
        };
    
        const drawGrid = () => {
            ctx.strokeStyle = gridColor;
            ctx.fillStyle = labelColor;
            ctx.font = "10px Verdana";
            ctx.textAlign = "center";
    
            ctx.beginPath();
            // ctx.strokeStyle = "#bd0ef1";
            ctx.strokeStyle = "#bd0ef1";
            ctx.lineWidth = 1;
            ctx.moveTo(marginLeft, containerHeight - marginBottom);
            ctx.lineTo(containerWidth - marginRight, containerHeight - marginBottom);
            ctx.stroke();
            ctx.strokeStyle = gridColor;
    
            for (const freq of freqsToDraw) {
                const x = xFromFreq(freq);
                ctx.beginPath();
                ctx.moveTo(x, marginTop);
                ctx.lineTo(x, containerHeight - marginBottom);
                ctx.stroke();
    
                let freqLabel = freq >= 1000 ? (freq / 1000) + "k" : freq.toString();
                ctx.fillText(freqLabel, x, containerHeight - marginBottom + 15);
            }
    
            ctx.textAlign = "right";
    
            const dbsToDraw = calculateDbMarkers();
    
            if (this.minDb < 0 && this.maxDb > 0) {
                const zeroDbY = yFromDb(0);
                ctx.strokeStyle = "#e4e4e4";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(marginLeft, zeroDbY);
                ctx.lineTo(containerWidth - marginRight, zeroDbY);
                ctx.stroke();
            }
    
            ctx.strokeStyle = gridColor;
    
            ctx.textAlign = "center";
            ctx.fillText("Frequency (Hz)", containerWidth / 2, containerHeight - 5);
    
            ctx.save();
            ctx.translate(12, containerHeight / 2 - marginBottom / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = "center";
            ctx.fillText("Amplitude (dB)", 0, 0);
            ctx.restore();
    
            ctx.textAlign = "right";
            for (const db of dbsToDraw) {
                const y = yFromDb(db);
                ctx.beginPath();
                ctx.moveTo(marginLeft, y);
                ctx.lineTo(containerWidth - marginRight, y);
                ctx.stroke();
    
                const dbLabel = db > 0 ? "+" + db + " dB" : db + " dB";
                ctx.fillText(dbLabel, marginLeft - 5, y + 3);
            }
        };
    
        const draw = () => {
            animationId = requestAnimationFrame(draw);
    
            analyser.getByteFrequencyData(dataArray);
    
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, containerWidth, containerHeight);
    
            drawGrid();
    
            ctx.beginPath();
            let started = false;
    
            let currentPeaks = [];
    
            const numPoints = Math.min(500, bufferLength);
    
            const smoothingFactor = 0.5;
            let prevY = null;
    
            for (let i = 0; i < numPoints; i++) {
                const t = i / (numPoints - 1);
                let freq = i === 0 ? 0 : Math.pow(this.maxFreq, t);
    
                const bin = Math.min(
                    bufferLength - 1,
                    Math.round(freq * analyser.fftSize / sampleRate)
                );
    
                const x = xFromFreq(freq);
                const value = dataArray[bin];
                const dB = dbScale(value);
                let y = yFromDb(dB);
    
                if (prevY !== null) {
                    y = prevY * smoothingFactor + y * (1 - smoothingFactor);
                }
                prevY = y;
    
                currentPeaks.push({ x, y, value, dB, freq });
    
                if (!started) {
                    ctx.moveTo(x, y);
                    started = true;
                } else {
                    ctx.lineTo(x, y);
                }
            }
    
            const gradient = ctx.createLinearGradient(0, marginTop, 0, containerHeight - marginBottom);
            gradient.addColorStop(0.2, "rgba(104, 231, 251, 0.59)");
            gradient.addColorStop(0.6, "rgba(98, 161, 206, 0.4)");
            gradient.addColorStop(1, "rgba(40, 123, 248, 0.2)");
    
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.lineWidth = 2;
            ctx.stroke();
    
            ctx.fillStyle = peakColor;
    
            for (let i = 0; i < currentPeaks.length; i++) {
                const peak = currentPeaks[i];
                let existingPeak = peakValues[i] || { value: 0, holdTime: 0 };
    
                if (peak.value > existingPeak.value) {
                    existingPeak = { value: peak.value, holdTime: peakHoldTime };
                } else {
                    existingPeak.holdTime--;
                    if (existingPeak.holdTime <= 0) {
                        existingPeak.value = Math.max(0, existingPeak.value - 1);
                        existingPeak.holdTime = 0;
                    }
                }
    
                peakValues[i] = existingPeak;
    
                const peakDb = dbScale(existingPeak.value);
                const peakY = yFromDb(peakDb);
    
                ctx.beginPath();
                ctx.arc(peak.x, peakY, 2, 0, 2 * Math.PI);
                ctx.fill();
            }
    
            ctx.beginPath();
            started = false;
    
            for (const peak of currentPeaks) {
                if (!started) {
                    ctx.moveTo(peak.x, peak.y);
                    started = true;
                } else {
                    ctx.lineTo(peak.x, peak.y);
                }
            }
    
            if (currentPeaks.length > 0) {
                const bottomY = yFromDb(this.minDb);
                ctx.lineTo(currentPeaks[currentPeaks.length - 1].x, bottomY);
                ctx.lineTo(currentPeaks[0].x, bottomY);
                ctx.closePath();
    
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        };
    
        draw();
        this._spectrumAnimationId = animationId;
    
        // Expose the drawing methods so they can be reused
        this._spectrumDraw = draw;
        this._spectrumDrawGrid = drawGrid;
    }

    isSpectrumAnalyzing() {
        return (this._spectrumAnimationId == null) ? false : true;
    }

    stopSpectrumAnalyzer() {
        if (this._spectrumAnimationId) {
            cancelAnimationFrame(this._spectrumAnimationId);
            this._spectrumAnimationId = null;
        }
    }

    setGate(val) {
        this.gateThreshold = val;
    }

    getGate() {
        return this.gateThreshold;
    }

    updateGate() {
        const { rms, min, max } = this.getLevel();
        const now = this.context.currentTime;

        // console.log(rms, this.gateThreshold, this.isGateOpen);
        if (rms > this.gateThreshold) {
            // Open
            this.gateGain.gain.cancelScheduledValues(now);
            this.gateGain.gain.setValueAtTime(this.gateGain.gain.value, now);
            this.gateGain.gain.linearRampToValueAtTime(1, now + this.gateAttack);
            this.isGateOpen = true;
        } else {
            // Close
            this.gateGain.gain.cancelScheduledValues(now);
            this.gateGain.gain.setValueAtTime(this.gateGain.gain.value, now);
            this.gateGain.gain.linearRampToValueAtTime(0, now + this.gateReleaseTime);
            this.isGateOpen = false;
        }
        
        // console.log(rms, this.gateThreshold, this.isGateOpen);
        requestAnimationFrame( () => this.updateGate());
    }

    disconnectAll() {
        try {
            this.inputAnalyser.disconnect();
            this.gateGain.disconnect();
            this.inputGain.disconnect();
        } catch (e) {}

        if (this.fxNodes.length > 0) {
            this.fxNodes.forEach((fx, index) => {
                try {
                    fx.output.disconnect();
                } catch (e) {}
            });
        }
    
        try {
            this.input.disconnect(this.bypass);
            this.bypass.disconnect(this.output);
        } catch (e) {}
    }

    buildChain() {
        if (this.firstBuild) {
            this.input.connect(this.inputAnalyser);
            this.inputAnalyser.connect(this.gateGain);
            this.gateGain.connect(this.inputGain);

            this.input.connect(this.bypass);
            this.bypass.connect(this.output);

            this.firstBuild = false;
        }
        
        this.disconnectAll();

        if (this.fxNodes.length > 0) {
            this.inputAnalyser.connect(this.gateGain);
            this.gateGain.connect(this.inputGain);
            this.inputGain.connect(this.fxNodes[0].getInput());
            for (let i = 0; i < this.fxNodes.length - 1; i++) {
                this.fxNodes[i].connect(this.fxNodes[i + 1].getInput());
            }

            this.fxNodes[this.fxNodes.length - 1].connect(this.panner);

        } else {
            this.inputAnalyser.connect(this.gateGain);
            this.gateGain.connect(this.inputGain);
            this.inputGain.connect(this.panner);
        }

        this.panner.connect(this.outputAnalyser);
        this.outputAnalyser.connect(this.output);
    }

    getLevel(type = "input") {
        let darr;
        let bufferLength;

        if (type == "input") {
            bufferLength = this.inputAnalyser.frequencyBinCount;
            darr = new Uint8Array(bufferLength);
            this.inputAnalyser.getByteTimeDomainData(darr);
        } else if (type == "output") {
            bufferLength = this.outputAnalyser.frequencyBinCount;
            darr = new Uint8Array(bufferLength);
            this.outputAnalyser.getByteTimeDomainData(darr);
        }

        let sum = 0;
        let min = 255;
        let max = 0;
    
        for (let i = 0; i < bufferLength; i++) {
            const val = darr[i];
            const normalized = (val - 128) / 128;
    
            sum += normalized * normalized;
            if (val < min) min = val;
            if (val > max) max = val;
        }
    
        const rms = Math.sqrt(sum / bufferLength);
        return {
            rms: rms,                            
            min: (min - 128) / 128,
            max: (max - 128) / 128
        };
    }

    getInputLevel() {
        const bufferLength = this.inputAnalyser.frequencyBinCount;
        this.inputAnalyser.getByteTimeDomainData(this.dataArray);
    
        let sum = 0;
        let min = 255;
        let max = 0;
    
        for (let i = 0; i < bufferLength; i++) {
            const val = this.dataArray[i];
            const normalized = (val - 128) / 128;
    
            sum += normalized * normalized;
            if (val < min) min = val;
            if (val > max) max = val;
        }
    
        const rms = Math.sqrt(sum / bufferLength);
        return {
            rms: rms,                            
            min: (min - 128) / 128,
            max: (max - 128) / 128
        };
    }

    getSignalLevel() {
        const dataArray = new Uint8Array(this.inputAnalyser.frecquencyBinCount);
        inputAnalyser.getByteFrequencyData(dataArray);
      
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
      
        return average;
    }

    connect(node) {
        this.output.connect(node);
    }

    disconnect(node) {
        this.output.disconnect(node);
    }

    addFX(node) {
        if (node.type == 'swc' && this.hasPatcher()) return;

        this.fxNodes.push(node);
        this.buildChain();
    }

    removeFX(index) {
        this.fxNodes[index].disconnect();
        this.fxNodes.splice(index, 1);
        this.buildChain();
    
        if (this.fxNodes.length == 0) {
            this.firstBuild = true;
            this.buildChain();
        }
    }

    swapFX(idx1, idx2) {
        const temp = this.fxNodes[idx1];
        this.fxNodes[idx1] = this.fxNodes[idx2];
        this.fxNodes[idx2] = temp;

        this.buildChain();
    }

    getSize() {
        return this.fxNodes.length;
    }

    addFXat(node, pos) {
        console.log(node.type, this.hasPatcher());
        if (node.type == 'swc' && this.hasPatcher()) return;

        this.fxNodes.splice(pos, 0, node);
        this.buildChain();
    }

    debugLoop() {
        if (this.fxNodes.length == 0) {
            console.log(this.name + " is empty");
            return;
        }

        for (let fx of this.fxNodes) {
            console.log(fx.getName());
        }
    }

    getFXTypes() {
        return this.fxNodes.map(fx => fx.type);
    }

    getFXTypesFull() {
        let res = [];
        for (let i = 0; i < this.fxNodes.length; i++) {
            res.push( this.fxNodes[i].subtype != "" ? this.fxNodes[i].subtype : this.fxNodes[i].type );
        }

        return res;
    }
    
    getFxLength() {
        return this.fxNodes.length;
    }

    isActive(index) {
        return this.fxNodes[index].isActive();
    }

    toggleThis() {
        this.active = !this.active;

        if (this.active) {
            this.inputGain.gain.value = 1;
            this.bypass.gain.value = 0;
        } else {
            this.inputGain.gain.value = 0;
            this.bypass.gain.value = 1;
        }
    }

    toggle(index) {
        this.fxNodes[index].toggle();
    }

    toggleChannel(index) {
        this.fxNodes[index].toggleChannel();
    }

    isChannelActive(index) {
        return this.fxNodes[index].isChannelActive();
    }

    setRoute(route, preset, name) {
        this.fxNodes.forEach(node => {
            if (node.type == 'swc') {
                node.setRoute(route, preset, name);
            }
        });
    }

    hasPatcher() {
        for (let i = 0; i < this.fxNodes.length; i++) {
            if (this.fxNodes[i].type == "swc") {
                return true;
            }
        }

        return false;
    }

    setImpulse(index, impulse) {
        console.log(impulse);
        this.fxNodes[index].setImpulse(impulse.buffer, impulse.name);
    }

    setBuffer(index, buffer, bufferName) {
        if (!this.fxNodes[index]) return;

        this.fxNodes[index].setImpulse(buffer, bufferName);
    }

    setParams(index, vals) {
        this.fxNodes[index].setParams(vals);
    }
    
    getColor() {
        return this.color;
    }

    setColor(color) {
        this.color = color;
    }

    setPreset(index, preset) {
        this.fxNodes[index].loadPreset(preset);
    }

    loadPreset() {

    }

    getPreset() {
        let nodePresets = {};

        this.fxNodes.forEach((node, index) => {
            nodePresets[`node${index + 1}`] = node.getPreset();
        });

        return {
            fxNodes   : this.fxNodes.length,
            nodes     : nodePresets
        };
    }

    setInput(val) {
        this.inputGain.gain.value = val;
    }

    setMaster(val) {
        this.output.gain.value = val;
    }

    getMaster() {
        return this.output.gain.value;
    }

    getInputValue() {
        return this.inputGain.gain.value;
    }

    isInputZero() {
        return (this.input.gain.value == 0);
    }

    inputZero() {
        this.input.gain.value = 0;
    }

    activateInput() {
        this.input.gain.value = 1;
    }

    setPan(val) {
        this.panner.pan.value = val;
    }

    getPan() {
        return this.panner.pan.value;
    }
}
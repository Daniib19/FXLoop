class FXManager {
    constructor(audioContext) {
        this.context = audioContext;
        this.name = "New Project";
        this.loops = {};
        this.size = 0;
        this.playing = false;
        // this.defaultColor = "#a9ec2d";
        this.defaultColor = "#6bf7bc";
    }

    getSize() {
        return this.size;
    }

    newLoop(loop, name = "Blank Loop", color = "#a9ec2d") {
        return {
            name: name,
            loop: loop,
            color: color,
            stoppedNaturally: false,
            stoppedFromPreset: false,
            isPlaying: false,
            isRecording: false,
            loopAudio: false,
            muted: false,
            solo: false,
            source: null,
            recordSource: null,
            recordDestination: null,
            recorder : null,
            recordedChunks : null,
            audioURL: null,
            recordedBlob : null,
            instrument: null,
            buffer: null,
            bufferName: null,
            playbackOffset: 0,
            startTime: 0
        };
    }

    createLoop(name, color = this.defaultColor) {
        const fxLoop = new FXLoop(this.context, name, this.size);
        fxLoop.setColor(color);
        this.loops[this.size] = this.newLoop(fxLoop, name, color);

        this.size ++;
        return fxLoop;
    }

    addLoop(loop) {
        this.loops[this.size] = this.newLoop(loop, loop.getName());
        this.size ++;
    }

    setName(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    removeLoop(index) {
        const loop = this.loops[index];
        if (!loop) return;
    
        if (loop.isPlaying) {
            this.stopAudio(index);
        }

        unbindFXUI(loop.loop);
    
        delete this.loops[index];
        this.size--;
    
        const newLoops = {};
        let newIndex = 0;
    
        for (let i = 0; i < this.size + 1; i++) {
            if (this.loops[i]) {
                newLoops[newIndex] = this.loops[i];
                newLoops[newIndex].loop.setIndex(newIndex);
                newIndex++;
            }
        }
    
        this.loops = newLoops;
        this.size = newIndex;

        this.init();
    }

    setBuffer(loopIndex, cabIndex, buffer) {
        this.loops[loopIndex].loop.setImpulse(cabIndex, buffer);
    }

    setName(index, name) {
        this.loops[index].loop.setName(name);
        this.loops[index].name = name;
    }

    setManagerName(name) {
        this.name = name;
    }

    getName(index) {
        return this.loops[index].name;
    }

    setParams(loopIndex, nodeIndex, values) {
        this.loops[loopIndex].loop.setParams(nodeIndex, values);
    }

    setColor(index, color) {
        this.loops[index].loop.setColor(color);
        this.loops[index].color = color;
    }

    getColor(index) {
        return this.loops[index].color;
    }

    startSpectrumAnalyzer(index, canvas) {
        this.loops[index].loop.startSpectrumAnalyzer(canvas);
    }

    stopSpectrumAnalyzer(index) {
        this.loops[index].loop.stopSpectrumAnalyzer();
    }

    async loadPreset(preset) {
        for (let i = 0; i < this.size; i++) {
            unbindFXUI(this.loops[i].loop);
        }

        this.loops = {};
        this.size = 0;

        this.name = preset.managerName;

        // create each track
        for (const [name, track] of Object.entries(preset.tracks)) {
            const newLoop = await createLoopFromPreset(track.preset);
            this.addLoop(newLoop);

            let loop = this.loops[this.size - 1];
            loop.loop.setIndex(this.size - 1);
            loop.loop.setColor(track.color);
            loop.loop.setPan(track.pan);
            loop.loop.setGate(track.gate);
            loop.loop.setMaster(track.volume);

            loop.name = track.name;
            loop.color = track.color;
            loop.buffer = audioBuffers[track.buffer];
            loop.bufferName = track.buffer;
            loop.playbackOffset = track.playbackOffset;
            loop.startTime = track.startTime,
            loop.pan = track.pan;
            loop.gate = track.gate;
            loop.volume = track.volume;
        }

        this.init();
    }

    getPreset() {
        let tracks = {};

        for (const [key, loop] of Object.entries(this.loops)) {
            tracks[`track${key}`] = {
                index: loop.loop.getIndex(),
                name: loop.name,
                color: loop.color,
                preset: loop.loop.getPreset(),
                stoppedNaturally: false,
                stoppedFromPreset: false,
                isPlaying: false,
                isRecording: false,
                loopAudio: false,
                muted: false,
                solo: false,
                source: null,
                recordSource: null,
                recordDestination: null,
                recorder : null,
                recordedChunks : null,
                audioURL: null,
                recordedBlob : null,
                instrument: null,
                buffer: loop.bufferName,
                playbackOffset: loop.playbackOffset,
                startTime: loop.startTime,
                pan: loop.loop.getPan(),
                volume: loop.loop.getMaster(),
                gate: loop.loop.getGate()
            };
        }

        return {
            managerName: this.name,
            numberOfTracks: this.size,
            tracks: tracks
        }
    }

    connect() {
        for (let i = 0; i < this.size; i++) {
            this.loops[i].loop.connect(this.context.destination);
        }

        console.log("all loops connected");
    }

    connectLoop(index) {
        this.loops[index].loop.connect(this.context.destination);

        console.log("connected loop" + index + " to context");
    }

    setTrim(index, startTime, endTime) {
        let audioBuffer = this.loops[index].buffer;
        if (!audioBuffer) return;
    
        const sampleRate = audioBuffer.sampleRate;
        const numberOfChannels = audioBuffer.numberOfChannels;
    
        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    
        const totalSamples = audioBuffer.length;
        const startSample = Math.floor(clamp(startTime, 0, audioBuffer.duration) * sampleRate);
        const endSample = Math.floor(clamp(endTime, 0, audioBuffer.duration) * sampleRate);
    
        if (startSample >= endSample || startSample >= totalSamples) {
            throw new Error("Invalid trim range.");
        }
    
        const keepBefore = startSample;
        const keepAfter = totalSamples - endSample;
        const frameCount = keepBefore + keepAfter;
    
        if (frameCount <= 0) {
            throw new Error("Resulting buffer would be empty.");
        }
    
        const trimmedBuffer = new AudioContext().createBuffer(
            numberOfChannels,
            frameCount,
            sampleRate
        );
    
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const originalData = audioBuffer.getChannelData(channel);
            const trimmedData = trimmedBuffer.getChannelData(channel);
    
            trimmedData.set(originalData.slice(0, startSample), 0);
            trimmedData.set(originalData.slice(endSample), keepBefore);
        }
    
        this.loadAudioBuffer(index, trimmedBuffer);
        this.createWaveFor(index);
    }

    createWaveFor(index) {
        const buffer = this.loops[index].buffer;
        const audioCanvas = $('#audio-canvas');
    
        if (!buffer || !(buffer instanceof AudioBuffer)) {
            console.log("Invalid audio buffer");
            return;
        }
    
        audioCanvas.empty();
    
        const ws = WaveSurfer.create({
            container: '#audio-canvas',
            waveColor: 'white',
            progressColor: 'red',
            cursorColor: 'white',
            height: 180,
            plugins: [
                WaveSurfer.regions.create({})
            ]
        });
    
        let isDragging = false;
        let lastX = 0;
    
        audioCanvas.on('wheel', function(event) {
            event.preventDefault();
            const delta = event.originalEvent.deltaY;
            const zoomChange = 10;
            const currentZoom = ws.params.minPxPerSec || 50;
    
            const newZoom = delta < 0 ? currentZoom + zoomChange : Math.max(currentZoom - zoomChange, 20);
            ws.zoom(newZoom);
        });
    
        audioCanvas.on('mousedown', function(event) {
            isDragging = true;
            lastX = event.pageX;
            $(this).css('cursor', 'move');
        });
    
        audioCanvas.on('mousemove', function(event) {
            if (isDragging) {
                const deltaX = event.pageX - lastX;
                const scrollAmount = deltaX / 2;
                this.scrollLeft += scrollAmount;
                lastX = event.pageX;
            }
        });
    
        audioCanvas.on('mouseup mouseleave', function() {
            isDragging = false;
            $(this).css('cursor', 'default');
        });
    
        audioCanvas.on('mousemove', function (event) {
            const offsetX = event.pageX - $(this).offset().left;
            const percentage = offsetX / $(this).width();
            const hoveredTime = ws.getDuration() * percentage;
            $("#hover-time").text(`${hoveredTime.toFixed(2)}s`);
        });
    
        // audioCanvas.on('click', function () {
        //     // const ctime = ws.getCurrentTime();
        //     // $("#trim-time").data("time", ctime);
        //     // $("#trim-time").html(`${ctime.toFixed(2)}s`);
        // });
    
        ws.on('ready', function() {
            const duration = ws.getDuration();
            $(".duration-span").html(`${duration.toFixed(2)}s`);
    
            const trimmer = ws.addRegion({
                start: 0,
                end: 2.5,
                id: "trimmer",
                color: 'rgba(251, 238, 99, 0.32)',
                drag: true,
                resize: true,
            });

            ws.on('region-updated', function (region) {
                const start = region.start;
                const end = region.end;
                const trimBlock = $("#trim-time");

                trimBlock.data('start', start);
                trimBlock.data('end', end);
                trimBlock.html(`( ${start.toFixed(2)}s, ${end.toFixed(2)}s )`);
            });

            // trimmer.element.classList.add('trimmer-off');
        });
    
        // Convert AudioBuffer to Blob and load it
        audioBufferToBlob(buffer).then((blob) => {
            const url = URL.createObjectURL(blob);
            ws.load(url);
        });
    
        return ws;
    }

    startRec(index, instrument) {
        const loop = this.loops[index];
        if (loop.isPlaying) {
            console.log("hello?");
            return false;
        }
        
        loop.instrument = instrument;
        loop.recordSource = this.context.createMediaStreamSource(loop.instrument);
        loop.recordSource.connect(loop.loop.getInput());
        
        if (!loop.recordDestination) {
            loop.recordDestination = this.context.createMediaStreamDestination();
            loop.loop.connect(loop.recordDestination);
        }        

        loop.recorder = new MediaRecorder(loop.recordDestination.stream);
        loop.recordedChunks = [];
        
        loop.recorder.ondataavailable = e => {
            if (e.data.size > 0)
                loop.recordedChunks.push(e.data);
        }
        
        loop.recorder.onstop = async () => {
            const confirmed = confirm("Save this recording ?");
            if (!confirmed) {
              return;
            }

            const blob = new Blob(loop.recordedChunks, { type: 'audio/webm' });
            const newBuffer = await this.blobToAudio(blob);
            loop.recordedBlob = blob;
            loop.audioURL = URL.createObjectURL(blob);
            this.loadAudioBuffer(index, newBuffer);

            loop.chunk = {
                buffer: loop.buffer,
                duration: loop.buffer.duration,
                start: 0,
                end: loop.buffer.duration
            };

            console.log(`finished recording on track ${loop.name}!`);
        }
        
        loop.recorder.start();
        loop.isRecording = true;

        return true;
    }

    stopRec(index) {
        const loop = this.loops[index];
        if (!loop.isRecording) return;
    
        loop.recordSource.disconnect();
        loop.instrument.getTracks().forEach(track => track.stop());
    
        if (loop.recorder && loop.recorder.state === 'recording') {
            loop.recorder.stop();
        }
    
        loop.recordSource = null;
        loop.instrument = null;
        loop.isRecording = false;
    }

    async blobToAudio(blob) {
        const arrayBuffer = await blob.arrayBuffer();
        return await this.context.decodeAudioData(arrayBuffer);
    }

    async playRecorded(index) {
        const newBuffer = await this.blobToAudio(this.loops[index].recordedBlob);
        this.loadAudioBuffer(index, newBuffer);
        this.startAudio(index);
    }

    startAudio(index, buffer = null) {
        if (this.size == 0) {
            return;
        }

        const loop = this.loops[index];
        if (loop.isRecording) {
            return false;
        }

        if (buffer == null && loop.buffer == null) {
            return false;
        }
        
        const source = this.context.createBufferSource();
        source.buffer = buffer || loop.buffer;

        source.connect(loop.loop.getInput());

        const offset = loop.playbackOffset || 0;
        loop.startTime = this.context.currentTime - offset;

        source.start(0, offset);
        
        source.onended = () => {
            // loop.isPlaying = false;
            // loop.source = null;

            // updateButtons(loop, index);

            // if (loop.loopAudio && loop.forceStop == false) {
            //     loop.playbackOffset = 0;
            //     this.startAudio(index, loop.buffer, true);
            //     updateButtons(loop, index);
            // }

            if (loop.loopAudio) {
                loop.playbackOffset = 0;
                this.startAudio(index);
            } else if (loop.stoppedFromPreset) {
                // do nothing
            } else {
                this.stopAudio(index, true);
                this.stoppedNaturally = true;
            }

            updateButtons(loop, index);
        };

        loop.source = source;
        loop.isPlaying = true;

        return true;
    }

    stopAudio(index, restart = false, force = false) {
        if (this.size == 0) {
            return;
        }

        const loop = this.loops[index];
        if (!loop.isPlaying) {
            return;
        }

        if (restart == false) {
            const currentTime = this.context.currentTime;
            loop.playbackOffset = currentTime - loop.startTime;
        } else {
            loop.playbackOffset = 0;
            loop.startTime = 0;
        }

        loop.stoppedNaturally = false;
        loop.stoppedFromPreset = force;
        loop.source.stop();
        loop.source.disconnect();
        loop.source = null;
        loop.isPlaying = false;
    }

    getSpectrumY(index) {
        return this.loops[index].loop.getSpectrumY();
    }

    setSpectrumX(index, min, max) {
        const loop = this.loops[index].loop;
        loop.setSpectrumX(min, max);
    }

    setSpectrumY(index, min, max) {
        const loop = this.loops[index].loop;
        loop.setSpectrumY(min, max);
    }

    async loadAudioPreset(index, preset) {
        let currentLoop = this.loops[index].loop;
        const oldLoopPlaying = this.loops[index].isPlaying;
        const oldLoopSpectrum = this.loops[index].loop.isSpectrumAnalyzing();
        console.log(oldLoopSpectrum);

        const retainedFX = currentLoop
            ? currentLoop.fxNodes.filter(node => node.type === "swc")
            : [];

        let newLoop = await createLoopFromPreset(preset);
        if (!newLoop) {
            console.log("eroare aici");
            return;
        }

        if (oldLoopPlaying) {
            this.stopAudio(index, false, true); // pastrez offsetu + isPlaying
        }

        if (oldLoopSpectrum) {
            currentLoop.stopSpectrumAnalyzer();
        }

        if (currentLoop) {
            unbindFXUI(currentLoop);
            currentLoop.clearAll();
            currentLoop = null;
        }
        
        newLoop.setName(this.loops[index].name);
        newLoop.setColor(this.loops[index].color);
        newLoop.setIndex(index);

        this.loops[index].loop = newLoop;
        this.connectLoop(index);

        retainedFX.forEach(node => {
            this.loops[index].loop.addFX(node);
        });

        if (oldLoopPlaying) {
            this.startAudio(index);
            this.loops[index].isPlaying = true;
        }

        if (oldLoopSpectrum) {
            const tryStartSpectrum = (retries = 10) => {
                const width = spectrumCanvas.clientWidth;
                const height = spectrumCanvas.clientHeight;
        
                if (width > 0 && height > 0) {
                    newLoop.startSpectrumAnalyzer(spectrumCanvas);
                } else if (retries > 0) {
                    setTimeout(() => tryStartSpectrum(retries - 1), 100);
                } else {
                    console.warn("Spectrum canvas is not ready after retries.");
                }
            };
        
            tryStartSpectrum();
        }

        this.updateUI();
    }

    toggleLoopAudio(index) {
        const loop = this.loops[index];

        if (!loop.isPlaying) {
            return;
        }
        
        loop.loopAudio = !loop.loopAudio;
        loop.source.loop = loop.loopAudio;
    }

    updateMeters() {
        for (let i = 0; i < this.size; i++) {
            updateInputMeterForLoop(this.loops[i].loop);
        }
    }

    isPlaying(index) {
        return this.loops[index].isPlaying;
    }

    isSolo(index) {
        return this.loops[index].solo;
    }

    isRecording(index) {
        return this.loops[index].isRecording;
    }

    isMuted(index) {
        return this.loops[index].muted;
    }

    mute(index) {
        if (this.loops[index].loop.getSize() == 0) {
            this.loops[index].loop.inputZero();
        }

        this.loops[index].loop.toggleThis();
        this.loops[index].muted = true;

        return this.loops[index].loop.isActiveThis();
    }

    unmute(index) {
        const loop = this.loops[index];
        if (loop.loop.isInputZero()) {
            loop.loop.activateInput();
        }

        if (!loop.loop.isActiveThis()) {
            loop.loop.toggleThis();
            loop.muted = false;
        }

        return loop.loop.isActiveThis();
    }

    loadAudioBuffer(index, buffer) {
        if (this.loops[index].isPlaying == true) {
            this.stopAudio(index, true);
        }
 
        this.loops[index].buffer = buffer;
        this.loops[index].bufferName = findBufferIndex(buffer);

        if (!chunkCard.hasClass('hide')) {
            this.createWaveFor(index);
        }
    }

    hasBuffer(index) {
        return this.loops[index].buffer == null ? false : true;
    }

    setInput(index, val) {
        this.loops[index].loop.setInput(val);
    }

    setMaster(index, val) {
        this.loops[index].loop.setMaster(val);
    }

    init() {
        this.connect();
        fxListElemt.empty();
        loopsManagers.empty();

        for (let i = 0; i < this.size; i++) {
            $(`#Loop-${i}-list`).empty();
            buildLoopControls(this.loops[i]);
            initalizeLoopSlider(i);
            initLoopSliders(i);
            updateLoopControls(this.loops[i].loop, i);
            updateFXLoopUI(this.loops[i].loop);
            updateInputMeterForLoop(this.loops[i].loop);
            updateButtons(this.loops[i], i);
        }
        updateProjectName(this.name);
        startMeterWatcher();
    }

    updateUI() {
        if (this.size == 0) return;

        fxListElemt.empty();
        loopsManagers.empty();

        for (let i = 0; i < this.size; i++) {
            $(`#Loop-${i}-list`).empty();
            unbindFXUI(this.loops[i].loop);
            buildLoopControls(this.loops[i]);
            initalizeLoopSlider(i);
            updateLoopControls(this.loops[i].loop, i);
            initLoopSliders(i);
            updateFXLoopUI(this.loops[i].loop);
            updateInputMeterForLoop(this.loops[i].loop);
            updateButtons(this.loops[i], i);
        }
        updateProjectName(this.name);
    }

    updatePatch(index) {
        fxListElemt.empty();
        $(`#Loop-${index}-list`).empty();
        updateLoopControls(this.loops[index].loop, index);
        updateFXLoopUI(this.loops[index].loop);
    }

    setRoute(index, route, preset, name) {
        this.loops[index].loop.setRoute(route, preset, name);
    }

    getLoopPreset(index) {
        return this.loops[index].loop.getPreset();
    }

    getLoopSize(index) {
        return this.loops[index].loop.getSize();
    }
    
    getLoop(index) {
        return this.loops[index].loop;
    }

    getTheLoop(index) {
        return this.loops[index];
    }

    isEmpty() {
        return (this.size == 0);
    }

    getSizeOfElements() {
        let size = 0;
        for (let i = 0; i < this.size; i++) {
            size += this.loops[i].loop.getSize();
        }

        return size;
    }

    isLoopOn(index) {
        return this.loops[index].loopAudio;
    }

    setLoopOn(index) {
        this.loops[index].loopAudio = true;
    }

    setLoopOff(index) {
        this.loops[index].loopAudio = false;
    }

    isSolo(index) {
        return this.loops[index].solo;
    }

    setSolo(index, state = true) {
        if (state == true) {
            for (let i = 0; i < this.size; i++) {
                this.mute(i);
                this.loops[i].solo = false;
                updateButtons(this.loops[i], i);
            }
            
            this.unmute(index);
            this.loops[index].solo = true;
            updateButtons(this.loops[index], index);
        } else if (state == false) {
            for (let i = 0; i < this.size; i++) {
                this.unmute(i);
                this.loops[i].solo = false;
                updateButtons(this.loops[i], i);
            }
        }

        this.updateMeters();
        startMeterWatcher();
    }

    setLoopPan(index, val) {
        this.loops[index].loop.setPan(val);
    }

    setGate(index, val) {
        this.loops[index].loop.setGate(val);
    }

    startAll() {
        if (this.size == 0) {
            return;
        }

        if (this.playing) {
            for (let i = 0; i < this.size; i++) {
                this.stopAudio(i, true);
                updateButtons(this.loops[i], i);
            }

            this.playing = false;

            return false;
        } 

        for (let i = 0; i < this.size; i++) {
            this.stopAudio(i, true);
            this.stopRec(i);
            this.startAudio(i);
            updateButtons(this.loops[i], i);
        }

        this.playing = true;
        return true;
    }
}
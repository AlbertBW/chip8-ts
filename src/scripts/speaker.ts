class Speaker {
  private audioCtx: AudioContext;
  private gain: GainNode;
  private finish: AudioDestinationNode;
  private oscillator: OscillatorNode | null;

  constructor() {
    const AudioContext = window.AudioContext;
    this.audioCtx = new AudioContext();
    this.oscillator = null;
    // Create a gain, which will allow us to control the volume
    this.gain = this.audioCtx.createGain();
    this.finish = this.audioCtx.destination;
    // Connect the gain to the audio context
    this.gain.connect(this.finish);
    this.gain.gain.value = 0.02;
  }

  volume(value: number) {
    this.gain.gain.value = value;
  }

  play(frequency: number) {
    if (this.audioCtx && !this.oscillator) {
      this.oscillator = this.audioCtx.createOscillator();

      // Set the frequency
      this.oscillator.frequency.setValueAtTime(
        frequency || 440,
        this.audioCtx.currentTime
      );

      // Square wave
      this.oscillator.type = "square";

      // Connect the gain and start the sound
      this.oscillator.connect(this.gain);
      this.oscillator.start();
    }
  }

  stop() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
  }
}

export default Speaker;

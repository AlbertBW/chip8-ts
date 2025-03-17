import Keyboard from "./keyboard";
import Renderer from "./renderer";
import Speaker from "./speaker";

class CPU {
  private renderer: Renderer;
  private keyboard: Keyboard;
  private speaker: Speaker;
  private memory: Uint8Array;
  private v: Uint8Array;
  private i: number;
  private delayTimer: number;
  private soundTimer: number;
  private pc: number;
  private stack: Array<number>;
  private paused: boolean;
  private speed: number;

  constructor(renderer: Renderer, keyboard: Keyboard, speaker: Speaker) {
    this.renderer = renderer;
    this.keyboard = keyboard;
    this.speaker = speaker;

    // 4KB (4096 bytes) of memory
    this.memory = new Uint8Array(4096);

    // 16 8-bit registers
    this.v = new Uint8Array(16);

    // Stored memory addresses. Set this to 0 since we aren't storing anything at initialisation
    this.i = 0;

    // Timers
    this.delayTimer = 0;
    this.soundTimer = 0;

    // Program counter. Stored the currently executing address.
    this.pc = 0x200;

    // Don't initialise this with a size in order to avoid empty results.
    this.stack = new Array();

    // Some instructions require pausing, such as Fx0A.
    this.paused = false;

    this.speed = 10;
  }

  loadSpritesIntoMemory() {
    const sprites = [
      0xf0,
      0x90,
      0x90,
      0x90,
      0xf0, // 0
      0x20,
      0x60,
      0x20,
      0x20,
      0x70, // 1
      0xf0,
      0x10,
      0xf0,
      0x80,
      0xf0, // 2
      0xf0,
      0x10,
      0xf0,
      0x10,
      0xf0, // 3
      0x90,
      0x90,
      0xf0,
      0x10,
      0x10, // 4
      0xf0,
      0x80,
      0xf0,
      0x10,
      0xf0, // 5
      0xf0,
      0x80,
      0xf0,
      0x90,
      0xf0, // 6
      0xf0,
      0x10,
      0x20,
      0x40,
      0x40, // 7
      0xf0,
      0x90,
      0xf0,
      0x90,
      0xf0, // 8
      0xf0,
      0x90,
      0xf0,
      0x10,
      0xf0, // 9
      0xf0,
      0x90,
      0xf0,
      0x90,
      0x90, // A
      0xe0,
      0x90,
      0xe0,
      0x90,
      0xe0, // B
      0xf0,
      0x80,
      0x80,
      0x80,
      0xf0, // C
      0xe0,
      0x90,
      0x90,
      0x90,
      0xe0, // D
      0xf0,
      0x80,
      0xf0,
      0x80,
      0xf0, // E
      0xf0,
      0x80,
      0xf0,
      0x80,
      0x80, // F
    ];

    // According to the technical reference, sprites are stored in the interpreter section of memory starting at hex 0x000
    for (let i = 0; i < sprites.length; i++) {
      this.memory[i] = sprites[i];
    }
  }

  reset() {
    this.memory = new Uint8Array(4096);
    this.v = new Uint8Array(16);
    this.i = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.pc = 0x200;
    this.stack = new Array();
    this.paused = false;
    this.speed = 10;
  }

  loadProgramIntoMemory(program: Uint8Array) {
    for (let loc = 0; loc < program.length; loc++) {
      this.memory[0x200 + loc] = program[loc];
    }
  }

  loadRom(romName: string) {
    var request = new XMLHttpRequest();
    var self = this;

    // Handles the response received from sending (request.send()) our request
    request.onload = function () {
      // If the request response has content
      if (request.response) {
        // Store the contents of the response in an 8-bit array
        let program = new Uint8Array(request.response);

        // Load the ROM into memory
        self.loadProgramIntoMemory(program);
      }
    };

    // Initialise a GET request to retrieve the ROM from our roms folder
    request.open("GET", "/roms/" + romName);
    request.responseType = "arraybuffer";

    // Send the GET request
    request.send();
  }

  cycle() {
    for (let i = 0; i < this.speed; i++) {
      if (!this.paused) {
        let opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
        this.executeInstruction(opcode);
      }
    }

    if (!this.paused) {
      this.updateTimers();
    }

    this.playSound();
    this.renderer.render();
  }

  updateTimers() {
    if (this.delayTimer > 0) {
      this.delayTimer -= 1;
    }

    if (this.soundTimer > 0) {
      this.soundTimer -= 1;
    }
  }

  playSound() {
    if (this.soundTimer > 0) {
      this.speaker.play(440);
    } else {
      this.speaker.stop();
    }
  }

  executeInstruction(opcode: number) {
    // Each instruction is 2 bytes long, so increment it by 2.
    this.pc += 2;

    // Grab the value of the 2nd nibble
    // shift it right 8 bits to get rid of everything but that 2nd nibble.
    let x = (opcode & 0x0f00) >> 8;

    // Grab the value of the 3rd nibble
    // shift it right 4 bits to get rid of everything but that 3rd nibble.
    let y = (opcode & 0x00f0) >> 4;
    switch (opcode & 0xf000) {
      case 0x0000:
        switch (opcode) {
          case 0x00e0:
            this.renderer.clear();
            break;
          case 0x00ee:
            const returnAddress = this.stack.pop();
            if (returnAddress !== undefined) {
              this.pc = returnAddress;
            } else {
              throw new Error(
                "Stack underflow: Attempted to pop from an empty stack."
              );
            }
            break;
        }

        break;
      case 0x1000:
        this.pc = opcode & 0xfff;
        break;
      case 0x2000:
        this.stack.push(this.pc);
        this.pc = opcode & 0xfff;
        break;
      case 0x3000:
        if (this.v[x] === (opcode & 0xff)) {
          this.pc += 2;
        }
        break;
      case 0x4000:
        if (this.v[x] !== (opcode & 0xff)) {
          this.pc += 2;
        }
        break;
      case 0x5000:
        if (this.v[x] === this.v[y]) {
          this.pc += 2;
        }
        break;
      case 0x6000:
        this.v[x] = opcode & 0xff;
        break;
      case 0x7000:
        this.v[x] += opcode & 0xff;
        break;
      case 0x8000:
        switch (opcode & 0xf) {
          case 0x0:
            this.v[x] = this.v[y];
            break;
          case 0x1:
            this.v[x] |= this.v[y];
            break;
          case 0x2:
            this.v[x] &= this.v[y];
            break;
          case 0x3:
            this.v[x] ^= this.v[y];
            break;
          case 0x4:
            let sum = (this.v[x] += this.v[y]);

            this.v[0xf] = 0;

            if (sum > 0xff) {
              this.v[0xf] = 1;
            }

            this.v[x] = sum;
            break;
          case 0x5:
            this.v[0xf] = 0;

            if (this.v[x] > this.v[y]) {
              this.v[0xf] = 1;
            }

            this.v[x] -= this.v[y];
            break;
          case 0x6:
            this.v[0xf] = this.v[x] & 0x1;

            this.v[x] >>= 1;
            break;
          case 0x7:
            this.v[0xf] = 0;

            if (this.v[y] > this.v[x]) {
              this.v[0xf] = 1;
            }

            this.v[x] = this.v[y] - this.v[x];
            break;
          case 0xe:
            this.v[0xf] = this.v[x] & 0x80;
            this.v[x] <<= 1;
            break;
        }

        break;
      case 0x9000:
        if (this.v[x] !== this.v[y]) {
          this.pc += 2;
        }
        break;
      case 0xa000:
        this.i = opcode & 0xfff;
        break;
      case 0xb000:
        this.pc = (opcode & 0xfff) + this.v[0];
        break;
      case 0xc000:
        let rand = Math.floor(Math.random() * 0xff);

        this.v[x] = rand & (opcode & 0xff);
        break;
      case 0xd000:
        let width = 8;
        let height = opcode & 0xf;

        this.v[0xf] = 0;

        for (let row = 0; row < height; row++) {
          let sprite = this.memory[this.i + row];

          for (let col = 0; col < width; col++) {
            // If the bit (sprite) is not 0, render/erase the pixel
            if ((sprite & 0x80) > 0) {
              // If setPixel returns 1, which means a pixel was erased, set VF to 1
              if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
                this.v[0xf] = 1;
              }
            }
            // Shift the sprite left 1. This will move the next next col/bit of the sprite into the first position.
            // Ex. 10010000 << 1 will become 0010000
            sprite <<= 1;
          }
        }
        break;
      case 0xe000:
        switch (opcode & 0xff) {
          case 0x9e:
            if (this.keyboard.isKeyPressed(this.v[x])) {
              this.pc += 2;
            }
            break;
          case 0xa1:
            if (!this.keyboard.isKeyPressed(this.v[x])) {
              this.pc += 2;
            }
            break;
        }

        break;
      case 0xf000:
        switch (opcode & 0xff) {
          case 0x07:
            this.v[x] = this.delayTimer;
            break;
          case 0x0a:
            this.paused = true;

            this.keyboard.onNextKeyPress = function (
              this: CPU,
              key: number
            ): undefined {
              this.v[x] = key;
              this.paused = false;
              return undefined;
            }.bind(this);
            break;
          case 0x15:
            this.delayTimer = this.v[x];
            break;
          case 0x18:
            this.soundTimer = this.v[x];
            break;
          case 0x1e:
            this.i += this.v[x];
            break;
          case 0x29:
            this.i = this.v[x] * 5;
            break;
          case 0x33:
            // Get the hundreds digit and place it in I.
            this.memory[this.i] = Math.floor(this.v[x] / 100);

            // Get tens digit and place it in I+1. Gets a value between 0 and 99.
            // then divides by 10 to give us a value between 0 and 9.
            this.memory[this.i + 1] = Math.floor((this.v[x] % 100) / 10);

            // Get the value of the ones (last) digit and place it in I+2.
            this.memory[this.i + 2] = Math.floor(this.v[x] % 10);
            break;
          case 0x55:
            for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
              this.memory[this.i + registerIndex] = this.v[registerIndex];
            }
            break;
          case 0x65:
            for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
              this.v[registerIndex] = this.memory[this.i + registerIndex];
            }
            break;
        }

        break;

      default:
        throw new Error("Unknown opcode " + opcode);
    }
  }
}

export default CPU;

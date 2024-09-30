type KeyMap = {
  [key: string]: number;
};

class Keyboard {
  private KEYMAP: KeyMap;
  public keysPressed: { [key: number]: boolean };
  onNextKeyPress: ((key: number) => void) | null = null;

  constructor() {
    this.KEYMAP = {
      Digit1: 0x1,
      Digit2: 0x2,
      Digit3: 0x3,
      Digit4: 0xc,
      KeyQ: 0x4,
      KeyW: 0x5,
      KeyE: 0x6,
      KeyR: 0xd,
      KeyA: 0x7,
      KeyS: 0x8,
      KeyD: 0x9,
      KeyF: 0xe,
      KeyZ: 0xa,
      KeyX: 0x0,
      KeyC: 0xb,
      KeyV: 0xf,
    };

    this.keysPressed = {};

    // Some chip-8 instructions require waiting for the next keypress. We initialise this function elsewhere when needed.
    this.onNextKeyPress = null;

    window.addEventListener("keydown", this.onKeyDown.bind(this), false);
    window.addEventListener("keyup", this.onKeyUp.bind(this), false);
  }

  isKeyPressed(keyCode: number) {
    return this.keysPressed[keyCode];
  }

  onKeyDown(event: KeyboardEvent) {
    const keyCode = event.code;
    const key = this.KEYMAP[keyCode];

    if (key !== undefined) {
      this.keysPressed[key] = true;

      if (this.onNextKeyPress) {
        this.onNextKeyPress(key);
        this.onNextKeyPress = null;
      }
    }
  }

  onKeyUp(event: KeyboardEvent) {
    let key = this.KEYMAP[event.code];
    this.keysPressed[key] = false;
  }
}

export default Keyboard;

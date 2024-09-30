import Renderer from "../scripts/renderer";
import Keyboard from "../scripts/keyboard";
import Speaker from "../scripts/speaker";
import CPU from "../scripts/cpu";

const renderer = new Renderer();
const keyboard = new Keyboard();
const speaker = new Speaker();
const cpu = new CPU(renderer, keyboard, speaker);

let fps = 60,
  fpsInterval: number,
  now,
  then: number,
  elapsed;

document.querySelectorAll(".rom-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    const romName =
      (event.target as HTMLElement)?.getAttribute("data-value") ?? null;
    if (romName) {
      loadAndRunROM(romName);
    }
  });
});

document
  .getElementById("file-upload")
  ?.addEventListener("change", (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        loadAndRunROMFromUint8Array(uint8Array);
      };
      reader.readAsArrayBuffer(file);
    }
  });

function loadAndRunROMFromUint8Array(rom: Uint8Array) {
  cpu.reset();
  renderer.clear();
  cpu.loadProgramIntoMemory(rom);
  init();
}

function loadAndRunROM(romName: string) {
  cpu.reset();
  renderer.clear();
  init(romName);
}

function init(romName?: string) {
  fpsInterval = 1000 / fps;
  then = Date.now();

  cpu.loadSpritesIntoMemory();
  if (romName) {
    cpu.loadRom(romName);
  }
  requestAnimationFrame(step);
}

function step() {
  now = Date.now();
  elapsed = now - then;

  if (elapsed > fpsInterval) {
    cpu.cycle();
    then = now - (elapsed % fpsInterval);
  }

  requestAnimationFrame(step);
}

init("snake.ch8");

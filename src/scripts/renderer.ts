class Renderer {
  private cols: number;
  private rows: number;
  private scale: number;
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private display: Array<any>;

  constructor() {
    this.cols = 64;
    this.rows = 32;
    this.scale = this.calculateScale();
    this.canvas = document.querySelector("canvas");
    if (this.canvas) {
      this.ctx = this.canvas.getContext("2d");
      this.canvas.width = this.cols * this.scale;
      this.canvas.height = this.rows * this.scale;
    } else {
      throw new Error("Canvas element not found");
    }
    this.display = new Array(this.cols * this.rows).fill(0);
    window.addEventListener("resize", this.updateCanvasSize.bind(this));
  }

  private calculateScale(): number {
    return Math.floor(window.innerWidth / this.cols);
  }

  private updateCanvasSize() {
    this.scale = this.calculateScale();
    if (this.canvas) {
      this.canvas.width = this.cols * this.scale;
      this.canvas.height = this.rows * this.scale;
    }
  }

  setPixel(x: number, y: number) {
    if (x > this.cols) {
      x -= this.cols;
    } else if (x < 0) {
      x += this.cols;
    }

    if (y > this.rows) {
      y -= this.rows;
    } else if (y < 0) {
      y += this.rows;
    }

    let pixelLoc = x + y * this.cols;
    this.display[pixelLoc] ^= 1;

    return !this.display[pixelLoc];
  }

  clear() {
    this.display = new Array(this.cols * this.rows).fill(0);
  }

  render() {
    if (this.ctx === null || this.canvas === null)
      throw new Error("ctx or canvas is null");

    // Clears the display every render cycle. Typical for a render loop.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.cols * this.rows; i++) {
      // Grabs the x position of the pixel based off of 'i'
      let x = (i % this.cols) * this.scale;

      // Grabs the y position of the pixel based off of 'i'
      let y = Math.floor(i / this.cols) * this.scale;

      if (this.display[i]) {
        this.ctx.fillStyle = "#00FF33";

        this.ctx.fillRect(x, y, this.scale, this.scale);
      }
    }
  }
}

export default Renderer;

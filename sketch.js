let exampleShader

function preload() {
    exampleShader = loadShader('example.vert', 'example.frag')
}

function setup() {
    createCanvas(700, 700, WEBGL)

    shader(exampleShader)

    noStroke();
}

function draw() {
    clear()

    exampleShader.setUniform('millis', millis());
    rect(0, 0, width, height)
}
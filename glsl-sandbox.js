export const loadShader = (context, type, source) => {
  const shader = context.createShader(type);
  // Send the source to the shader object
  context.shaderSource(shader, source);
  // Compile the shader program
  context.compileShader(shader);
  // See if it compiled successfully
  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + context.getShaderInfoLog(shader));
    context.deleteShader(shader);
    return null;
  }

  return shader;
}

export const vertexShaderSource = `
attribute vec4 aVertexPosition;
void main() { gl_Position = aVertexPosition; }
`;

export const getRenderFunction = (context, uniformLocations) => (time, mouseX, mouseY, resolutionX, resolutionY, invert) => {
  // Clear the canvas before we start drawing on it.
  context.clearColor(1.0, 1.0, 1.0, 1.0);  // Clear to black, fully opaque
  context.clearDepth(1.0);                 // Clear everything
  context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

  context.uniform2fv(uniformLocations.resolution, [resolutionX, resolutionY]);
  context.uniform2fv(uniformLocations.mouse, [mouseX, mouseY]);
  context.uniform1f(uniformLocations.time, time / 2000);
  context.uniform1i(uniformLocations.invert, invert ? 1 : 0);

  context.viewport(0, 0, resolutionX, resolutionY);
  context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
};

export const createRenderer = (fragmentShaderSource) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl');

  const vertexShader = loadShader(context, context.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = loadShader(context, context.FRAGMENT_SHADER, fragmentShaderSource);

  const shaderProgram = context.createProgram();
  context.attachShader(shaderProgram, vertexShader);
  context.attachShader(shaderProgram, fragmentShader);
  context.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!context.getProgramParameter(shaderProgram, context.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + context.getProgramInfoLog(shaderProgram));
  }

  // Create a buffer for the square's positions.
  const positionBuffer = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);

  const positions = Float32Array.from([
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0,
  ]);

  context.bufferData(context.ARRAY_BUFFER, positions, context.STATIC_DRAW);
  context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);

  // get pointers to uniforms
  const resolution = context.getUniformLocation(shaderProgram, 'resolution');
  const mouse = context.getUniformLocation(shaderProgram, 'mouse');
  const time = context.getUniformLocation(shaderProgram, 'time');
  const invert = context.getUniformLocation(shaderProgram, 'invert');

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  const vertexPositionLocation = context.getAttribLocation(shaderProgram, 'aVertexPosition');
  context.vertexAttribPointer(vertexPositionLocation, 2, context.FLOAT, false, 0, 0);
  context.enableVertexAttribArray(vertexPositionLocation);

  // Tell WebGL to use our program when drawing
  context.useProgram(shaderProgram);

  const draw = getRenderFunction(context, { resolution, mouse, time, invert });
  return { canvas, draw };
};

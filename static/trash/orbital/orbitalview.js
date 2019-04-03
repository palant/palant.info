function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript)
        return null;

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, shaderScript.textContent);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var gl = null;
var vertexArray, normalArray;
var rotUniform, transUniform;
var numVertexPoints;
var buffers = {};
function renderStart() {
  var canvas = document.getElementById("canvas");
  try {
    if (!gl)
      gl = canvas.getContext("webgl");
  } catch (e) { }
  try {
    if (!gl)
      gl = canvas.getContext("experimental-webgl");
  } catch (e) { }
  try {
    if (!gl)
      gl = canvas.getContext("moz-webgl");
  } catch (e) { }
  try { 
    if (!gl)
      gl = canvas.getContext("webkit-3d");
  } catch (e) { }

  if (!gl) {
    alert("Can't find a WebGL context; is it enabled?");
    return;
  }

  var prog = gl.createProgram();
  gl.attachShader(prog, getShader(gl, "shader-fs"));
  gl.attachShader(prog, getShader(gl, "shader-vs"));

  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    alert(gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  rotUniform = gl.getUniformLocation(prog, "uRotMatrix");
  transUniform = gl.getUniformLocation(prog, "uTransMatrix");

  vertexArray = gl.getAttribLocation(prog, "aVertex");
  buffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

  normalArray = gl.getAttribLocation(prog, "aNormal");
  buffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);

  gl.clearColor(0.4, 0.4, 0.4, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Initialize shader parameters
  setMatrixParam(rotUniform, rotMatrix);

  var pmUniform = gl.getUniformLocation(prog, "uPMatrix");
  var pmMatrix = M4x4.makePerspective(60, 1, 0.01, 100);
  setMatrixParam(pmUniform, pmMatrix);

  var lightDirParam = gl.getUniformLocation(prog, "uLightDir");
  gl.uniform3f(lightDirParam, 0, 0, 1);

  var colorParam = gl.getUniformLocation(prog, "uColor");
  gl.uniform3f(colorParam, 1, 0.5, 0);

  onSelectionUpdate();
  initMouse(canvas);
  recalculate();
}

function initMouse(canvas) {
  var mouseDown = false;
  var lastMousePos;

  canvas.addEventListener("mousedown", function(ev) {
                            mouseDown = true;
                            lastMousePos = [ev.screenX, ev.screenY];
                            return true;
                          }, false);

  canvas.addEventListener("mousemove", function(ev) {
                            if (!mouseDown)
                              return false;

                            if (ev.shiftKey) {
                              if (ev.screenY - lastMousePos[1])
                                doZoom(lastMousePos[1] - ev.screenY);
                            }
                            else if (ev.ctrlKey || ev.metaKey) {
                              doTranslate(ev.screenX - lastMousePos[0], lastMousePos[1] - ev.screenY);
                            }
                            else {
                              if (ev.screenX - lastMousePos[0])
                                doRotate(ev.screenX - lastMousePos[0], V3.$(0,1,0));
                              if (ev.screenY - lastMousePos[1])
                                doRotate(ev.screenY - lastMousePos[1], V3.$(1,0,0));
                            }
                            lastMousePos = [ev.screenX, ev.screenY];

                            draw();
                            return true;
                          }, false);

  canvas.addEventListener("mouseup", function(ev) {
                            mouseDown = false;
                          }, false);

  canvas.addEventListener("mouseout", function(ev) {
                            mouseDown = false;
                          }, false);
}

function setMatrixParam(param, matrix) {
  gl.uniformMatrix4fv(param, false, matrix);
}

function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, numVertexPoints);
}

var rotMatrix = M4x4.$(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1);
const rotUnitToAngle = Math.PI / 180; // 1px = 1°
function doRotate(units, v) {
  var angle = units * rotUnitToAngle;
  var inv = M4x4.inverseTo3x3(rotMatrix);
  v = V3.$(V3.dot(v, [inv[0], inv[1], inv[2]]),
           V3.dot(v, [inv[3], inv[4], inv[5]]),
           V3.dot(v, [inv[6], inv[7], inv[8]]));
  rotMatrix = M4x4.rotate(angle, v, rotMatrix);
  setMatrixParam(rotUniform, rotMatrix);
}

// default distance from the object is -3 * maxCoord
var maxCoord = 1;
var transMatrix = M4x4.makeTranslate3(0, 0, -3 * maxCoord);
const transUnitScaling = 0.01; // 100px = maxCoord
function doTranslate(unitsX, unitsY) {
  M4x4.translate3(
    maxCoord * unitsX * transUnitScaling, maxCoord * unitsY * transUnitScaling, 0,
    transMatrix, transMatrix);
  setMatrixParam(transUniform, transMatrix);
}
const zoomUnitScaling = 0.01; // 100px = maxCoord
function doZoom(units) {
  M4x4.translate3(
    0, 0, maxCoord * units * zoomUnitScaling,
    transMatrix, transMatrix);
  if (transMatrix[14] > 0)
    transMatrix[14] = 0;
  setMatrixParam(transUniform, transMatrix);
}

function recalculate() {
  if (!gl)
    throw "Not initialized";

  function getCoords(l, m, phi, theta, result)
  {
    var r = 0;
    for (var i = 0; i <= (l - m) / 2; i++) {
      var factor = Math.pow(Math.cos(theta), l - m - 2 * i) / Math.pow(-2, i);

      for (var j = 0; j <= 2*i - 1; j++)
        factor *= l - m - j;
      for (var j = 1; j <= i; j++)
        factor /= 2*l - 2*j + 1;
      for (var j = 2; j <= i; j++)
        factor /= j;

      r += factor;
    }
    r *= (2 * l - 1) * Math.pow(Math.sin(theta), m) * Math.pow(Math.sin(phi), m);
    r = Math.abs(r);

    result[0] = Math.cos(phi) * Math.sin(theta) * r;
    result[1] = Math.sin(phi) * Math.sin(theta) * r;
    result[2] = Math.cos(theta) * r;
  }

  var maxAngle = 2 * Math.PI;

  var l = parseInt(document.getElementById("l").value);
  var m = parseInt(document.getElementById("m").value);
  var step = parseFloat(document.getElementById("step").value) * maxAngle / 360;

  if (m > l)
    m = l;

  // calculate data
  var numSteps = Math.round(maxAngle / step);
  var meshData = new Float32Array(numSteps * numSteps * 6 * 3 * 4);
  var normals = new Float32Array(numSteps * numSteps * 6 * 3 * 4);
  var i = 0, j = 0;
  var point1 = V3.$(), point2 = V3.$(), point3 = V3.$(), point4 = V3.$();
  var spanning1 = V3.$(), spanning2 = V3.$(), spanning3 = V3.$();
  var normal1 = V3.$(), normal2 = V3.$();
  for (var phiIndex = 0; phiIndex < numSteps; phiIndex++) {
    var phi = maxAngle * phiIndex / numSteps;
    for (var thetaIndex = 0; thetaIndex < numSteps; thetaIndex++) {
      var theta = maxAngle * thetaIndex / numSteps;
      getCoords(l, m, phi, theta, point1);
      getCoords(l, m, phi + step, theta, point2);
      getCoords(l, m, phi, theta + step, point3);
      getCoords(l, m, phi + step, theta + step, point4);

      function pushDataPoint(point) {
        meshData[i++] = point[0];
        meshData[i++] = point[1];
        meshData[i++] = point[2];
      }

      pushDataPoint(point1);
      pushDataPoint(point2);
      pushDataPoint(point3);

      pushDataPoint(point4);
      pushDataPoint(point3);
      pushDataPoint(point2);

      V3.sub(point2, point3, spanning1);
      V3.sub(point1, point2, spanning2);
      V3.sub(point4, point3, spanning3);

      V3.cross(spanning1, spanning2, normal1);
      V3.cross(spanning1, spanning3, normal2);

      function pushNormal(normal) {
        normals[j++] = normal[0];
        normals[j++] = normal[1];
        normals[j++] = normal[2];
      }

      pushNormal(normal1);
      pushNormal(normal1);
      pushNormal(normal1);

      pushNormal(normal2);
      pushNormal(normal2);
      pushNormal(normal2);
    }
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, meshData, gl.STATIC_DRAW);
  gl.vertexAttribPointer(vertexArray, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexArray);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  gl.vertexAttribPointer(normalArray, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalArray);

  numVertexPoints = meshData.length / 3;

  // Recalculate translation matrix according to new dimentions
  var newMaxCoord = 0;
  for (var i = 0; i < meshData.length; i++)
    if (meshData[i] > newMaxCoord)
      newMaxCoord = meshData[i];
  for (var i = 12; i <= 14; i++)
    transMatrix[i] *= newMaxCoord / maxCoord;
  maxCoord = newMaxCoord;
  setMatrixParam(transUniform, transMatrix);

  draw();
}

function resetPos() {
  rotMatrix = M4x4.$(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1);
  setMatrixParam(rotUniform, rotMatrix);

  transMatrix = M4x4.makeTranslate3(0, 0, -3 * maxCoord);
  setMatrixParam(transUniform, transMatrix);

  draw();
}

// Enforce m <= l relation
function onSelectionUpdate() {
  var l = parseInt(document.getElementById("l").value);
  var m = parseInt(document.getElementById("m").value);

  if (m > l)
    document.getElementById("m").value = l;

  var options = document.getElementById("m").options;
  for (var i = 0; i < options.length; i++)
    options[i].disabled = (parseInt(options[i].value) > l);
}

window.addEventListener("load", renderStart, false);

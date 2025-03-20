'use client';

import { useEffect, useRef } from 'react';
import { ColorStop, GradientStyle } from '../utils/colors';

interface WebGLGradientProps {
  colorStops: ColorStop[];
  style: GradientStyle;
  warpSize: number;
  warpAmount: number;
  warpType: 'wave' | 'ripple' | 'none';
  grainAmount: number;
}

export function WebGLGradient({
  colorStops,
  style,
  warpSize,
  warpAmount,
  warpType,
  grainAmount,
}: WebGLGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);

  const vertexShaderSource = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision highp float;
    varying vec2 vUv;
    uniform vec3 colors[6];
    uniform float positions[6];
    uniform float warpSize;
    uniform float warpAmount;
    uniform int warpType;
    uniform float grainAmount;
    uniform float time;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec2 warp(vec2 uv) {
      if (warpType == 0) return uv;
      
      float x = uv.x;
      float y = uv.y;
      
      if (warpType == 1) { // Wave
        y += sin(x * 10.0 + time) * warpAmount * warpSize;
      } else if (warpType == 2) { // Ripple
        float dist = length(uv - vec2(0.5));
        float ripple = sin(dist * 10.0 - time) * warpAmount * warpSize;
        y += ripple;
      }
      
      return vec2(x, y);
    }

    vec3 gradient(vec2 uv) {
      vec2 warpedUv = warp(uv);
      vec3 color = vec3(0.0);
      
      for (int i = 0; i < 5; i++) {
        float t = (warpedUv.x - positions[i]) / (positions[i + 1] - positions[i]);
        t = clamp(t, 0.0, 1.0);
        color += mix(colors[i], colors[i + 1], t);
      }
      
      return color;
    }

    void main() {
      vec3 color = gradient(vUv);
      
      // Add grain
      float grain = noise(vUv + time) * grainAmount;
      color += vec3(grain);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    glRef.current = gl;

    // Create shader program
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    programRef.current = program;

    // Set up buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]), gl.STATIC_DRAW);

    // Set up attributes
    const positionAttribute = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    // Set up uniforms
    const colorsUniform = gl.getUniformLocation(program, 'colors');
    const positionsUniform = gl.getUniformLocation(program, 'positions');
    const warpSizeUniform = gl.getUniformLocation(program, 'warpSize');
    const warpAmountUniform = gl.getUniformLocation(program, 'warpAmount');
    const warpTypeUniform = gl.getUniformLocation(program, 'warpType');
    const grainAmountUniform = gl.getUniformLocation(program, 'grainAmount');
    const timeUniform = gl.getUniformLocation(program, 'time');

    let startTime = Date.now();

    function render() {
      if (!gl || !program) return;

      // Update uniforms
      gl.useProgram(program);
      gl.uniform3fv(colorsUniform, new Float32Array(colorStops.flatMap(stop => hexToRgb(stop.color))));
      gl.uniform1fv(positionsUniform, new Float32Array(colorStops.map(stop => stop.position)));
      gl.uniform1f(warpSizeUniform, warpSize);
      gl.uniform1f(warpAmountUniform, warpAmount);
      gl.uniform1i(warpTypeUniform, warpType === 'none' ? 0 : warpType === 'wave' ? 1 : 2);
      gl.uniform1f(grainAmountUniform, grainAmount);
      gl.uniform1f(timeUniform, (Date.now() - startTime) / 1000);

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }

    render();

    return () => {
      gl.deleteProgram(program);
    };
  }, [colorStops, style, warpSize, warpAmount, warpType, grainAmount]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded-lg"
      style={{ width: '100%', height: '128px' }}
    />
  );
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
    return null;
  }

  return program;
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [0, 0, 0];
} 
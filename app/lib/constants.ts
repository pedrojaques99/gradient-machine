export const CANVAS = {
  WIDTH: 800,
  HEIGHT: 400,
  DPR: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
} as const;

export const COLOR_STOP = {
  SIZE: {
    DEFAULT: 20,
    HOVER: 24,
    ACTIVE: 22,
  },
  BORDER: {
    WIDTH: 2,
    HOVER_WIDTH: 3,
  },
  TRACK: {
    HEIGHT: 6,
    PADDING: 24,
    OPACITY: 0.15,
  },
  GUIDE_LINE: {
    OPACITY: 0.1,
    WIDTH: 1,
  },
} as const;

export const WEBGL = {
  VERTEX_SHADER: `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `,
  FRAGMENT_SHADER: `
    precision highp float;
    varying vec2 vUv;
    uniform vec3 colors[16];  // Increased max colors
    uniform float positions[16];  // Increased max positions
    uniform int colorCount;  // Number of colors to use

    vec3 gradient(vec2 uv) {
      vec3 color = colors[0];
      
      for (int i = 0; i < 15; i++) {
        if (i >= colorCount - 1) break;
        
        float t = (uv.x - positions[i]) / (positions[i + 1] - positions[i]);
        t = clamp(t, 0.0, 1.0);
        color = mix(colors[i], colors[i + 1], t);
      }
      
      return color;
    }

    void main() {
      vec3 color = gradient(vUv);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
} as const;

export const ANIMATION = {
  DURATION: 200,
  EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const DEFAULT_COLORS = {
  PRIMARY: '#7961D3',
  STOPS: ['#ff0000', '#00ff00'],
} as const; 
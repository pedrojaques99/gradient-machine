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

export const GRADIENT_CLASSES = {
  base: "animate-gradient bg-gradient-to-r blur-2xl transition-all duration-700",
  colors: "from-accent/10 via-zinc-900/50 to-accent/10",
  hover: "group-hover:blur-xl group-hover:from-accent/20 group-hover:to-accent/20",
  delayed: {
    base: "animate-gradient-delayed",
    colors: "from-zinc-900/40 via-accent/10 to-zinc-900/40",
    hover: "group-hover:via-accent/20"
  },
  moreDelayed: {
    base: "animate-gradient-more-delayed",
    colors: "from-accent/10 via-zinc-900/50 to-accent/10",
    hover: "group-hover:from-accent/20 group-hover:to-accent/20"
  }
} as const;

export const ACCENT_HIGHLIGHT_CLASSES = {
  container: "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000",
  highlight: "absolute w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-pulse"
} as const;

export const UI_SPACING = {
  container: {
    maxWidth: "max-w-2xl",
    padding: "px-4 md:px-6",
    gap: "gap-8 md:gap-12"
  },
  section: {
    padding: "py-6 md:py-8",
    gap: "gap-4 md:gap-6"
  },
  card: {
    padding: "p-4 md:p-6",
    gap: "gap-4"
  },
  grid: {
    cols: "grid-cols-2 md:grid-cols-4",
    gap: "gap-3"
  }
} as const;

export const UI_CLASSES = {
  sectionTitle: "text-xs font-medium text-muted-foreground tracking-wide uppercase",
  card: "bg-zinc-900/50 rounded-md backdrop-blur-sm border border-white/5 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5",
  container: "container mx-auto",
  instructionText: "text-xs text-muted-foreground leading-relaxed",
  highlight: "text-accent font-medium"
} as const; 
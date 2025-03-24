import { SxProps, Theme } from '@mui/material';

export const styles = {
  gradientCard: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(45deg, #00ff00 0%, #ff00ff 100%)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, rgba(0,255,0,0.1) 0%, rgba(255,0,255,0.1) 100%)',
      zIndex: 1,
    },
  } as SxProps<Theme>,

  gradientText: {
    background: 'linear-gradient(45deg, #00ff00 0%, #ff00ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent',
  } as SxProps<Theme>,

  gradientBorder: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 'inherit',
      padding: '2px',
      background: 'linear-gradient(45deg, #00ff00 0%, #ff00ff 100%)',
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    },
  } as SxProps<Theme>,

  glassEffect: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  } as SxProps<Theme>,

  neonGlow: {
    boxShadow: '0 0 10px rgba(0, 255, 0, 0.5), 0 0 20px rgba(255, 0, 255, 0.5)',
  } as SxProps<Theme>,

  gradientButton: {
    background: 'linear-gradient(45deg, #00ff00 0%, #ff00ff 100%)',
    color: '#000',
    '&:hover': {
      background: 'linear-gradient(45deg, #00cc00 0%, #cc00cc 100%)',
    },
  } as SxProps<Theme>,

  animatedGradient: {
    background: 'linear-gradient(45deg, #00ff00, #ff00ff, #00ff00)',
    backgroundSize: '200% 200%',
    animation: 'gradient 3s ease infinite',
    '@keyframes gradient': {
      '0%': {
        backgroundPosition: '0% 50%',
      },
      '50%': {
        backgroundPosition: '100% 50%',
      },
      '100%': {
        backgroundPosition: '0% 50%',
      },
    },
  } as SxProps<Theme>,
}; 
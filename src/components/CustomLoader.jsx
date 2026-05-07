import React from 'react';
import { Box, useTheme } from '@mui/material';

const CustomLoader = ({ size = 48, sx = {} }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      ...sx
    }}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          position: 'relative',
          animation: 'rotate 1s linear infinite',
          '&::before, &::after': {
            content: '""',
            boxSizing: 'border-box',
            position: 'absolute',
            inset: '0px',
            borderRadius: '50%',
            border: '5px solid',
            borderColor: theme.palette.primary.main,
            animation: 'prixClipFix 2s linear infinite',
          },
          '&::after': {
            transform: 'rotate3d(90, 90, 0, 180deg)',
            borderColor: theme.palette.secondary.main,
          },
          '@keyframes rotate': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
          '@keyframes prixClipFix': {
            '0%': { clipPath: 'polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)' },
            '50%': { clipPath: 'polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)' },
            '75%, 100%': { clipPath: 'polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)' },
          }
        }}
      />
    </Box>
  );
};

export default CustomLoader;

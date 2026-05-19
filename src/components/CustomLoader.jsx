import React from 'react';
import { Box } from '@mui/material';

const CustomLoader = ({ size = 80, sx = {} }) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      ...sx
    }}>
      <Box
        sx={{
          width: size * 1.5,
          height: size,
          position: 'relative',
          animation: 'floatFlat 2.5s ease-in-out infinite',
          '@keyframes floatFlat': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-4px)' }
          }
        }}
      >
        <svg
          viewBox="0 0 120 80"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Text Clip Path for Liquid Mask */}
            <clipPath id="textClip">
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'Outfit', 'Inter', 'Segoe UI', sans-serif"
                fontWeight="900"
                fontSize="52"
                letterSpacing="2"
              >
                TM
              </text>
            </clipPath>

            {/* Glowing Neon Filter */}
            <filter id="liquidGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradient Fill for Liquid */}
            <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00f3ff" />
              <stop offset="100%" stopColor="#0072ff" />
            </linearGradient>
            
            {/* Gradient for Outer Glow Outline */}
            <linearGradient id="outlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0, 243, 255, 0.4)" />
              <stop offset="100%" stopColor="rgba(0, 114, 255, 0.4)" />
            </linearGradient>
          </defs>

          {/* 1. Neon Glowing Outline/Chassis (Always visible behind liquid) */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Outfit', 'Inter', 'Segoe UI', sans-serif"
            fontWeight="900"
            fontSize="52"
            letterSpacing="2"
            fill="none"
            stroke="url(#outlineGrad)"
            strokeWidth="1.5"
            filter="url(#liquidGlow)"
            style={{
              opacity: 0.85,
              animation: 'glowPulse 1.2s ease-in-out infinite'
            }}
          >
            TM
          </text>

          {/* 2. Liquid-filled Masked Group */}
          <g clipPath="url(#textClip)">
            {/* Dark background base for letters */}
            <rect x="0" y="0" width="120" height="80" fill="rgba(0, 114, 255, 0.05)" />

            {/* Rising and falling wave containers */}
            <g className="liquid-level">
              
              {/* Back Wave (slower, offset color) */}
              <path
                className="wave wave-back"
                d="M 0 50 Q 15 44, 30 50 T 60 50 T 90 50 T 120 50 T 150 50 T 180 50 T 210 50 T 240 50 L 240 120 L 0 120 Z"
                fill="#0072ff"
                opacity="0.45"
              />

              {/* Front Wave (faster, main glow color) */}
              <path
                className="wave wave-front"
                d="M 0 50 Q 15 45, 30 50 T 60 50 T 90 50 T 120 50 T 150 50 T 180 50 T 210 50 T 240 50 L 240 120 L 0 120 Z"
                fill="url(#liquidGrad)"
                opacity="0.9"
                filter="url(#liquidGlow)"
              />
            </g>
          </g>
        </svg>

        {/* CSS Keyframes for Wave Fluid Simulation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes glowPulse {
            0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 2px rgba(0, 243, 255, 0.3)) url(#liquidGlow); }
            50% { opacity: 0.95; filter: drop-shadow(0 0 8px rgba(0, 243, 255, 0.7)) url(#liquidGlow); }
          }
          
          /* Controls the liquid level rising and falling */
          .liquid-level {
            animation: riseAndFall 2.2s ease-in-out infinite;
          }
          
          /* Horizontal wave scrolling animations */
          .wave-back {
            animation: moveWaveLeft 1.2s linear infinite;
          }
          .wave-front {
            animation: moveWaveRight 0.8s linear infinite;
          }

          @keyframes riseAndFall {
            0% {
              transform: translateY(28px); /* Empty */
            }
            50% {
              transform: translateY(-24px); /* Full */
            }
            100% {
              transform: translateY(28px); /* Empty */
            }
          }

          @keyframes moveWaveLeft {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-120px);
            }
          }

          @keyframes moveWaveRight {
            0% {
              transform: translateX(-120px);
            }
            100% {
              transform: translateX(0);
            }
          }
        `}} />
      </Box>
    </Box>
  );
};

export default CustomLoader;

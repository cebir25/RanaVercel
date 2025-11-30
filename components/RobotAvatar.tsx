

import React from 'react';
import { AvatarStatus } from '../types';

interface RobotAvatarProps {
  status: AvatarStatus;
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({ status }) => {
  return (
    <div className="w-48 h-48">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="robot-body-gradient" x1="0.5" x2="0.5" y1="0" y2="1">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
          <radialGradient id="envy-eye-gradient" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0891B2" />
          </radialGradient>
          <radialGradient id="heart-gradient" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#f9a8d4" />
            <stop offset="100%" stopColor="#f472b6" />
          </radialGradient>
          <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>

        <style>
          {`
            .robot-group {
              transform-origin: center center;
              transition: transform 0.3s ease-in-out;
            }
            .robot-group.idle, .robot-group.thinking {
              animation: head-bob 2.5s infinite ease-in-out;
            }
            @keyframes head-bob {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }

            .blink {
               animation: blink-animation 4s infinite ease-in-out;
               transform-origin: center;
            }
            @keyframes blink-animation {
              0%, 94%, 100% { transform: scaleY(1); }
              97% { transform: scaleY(0.05); }
            }
            
            .mouth-closed { display: ${status === AvatarStatus.IDLE || status === AvatarStatus.THINKING ? 'block' : 'none'}; }
            .mouth-open { display: ${status === AvatarStatus.LISTENING || status === AvatarStatus.SPEAKING ? 'block' : 'none'}; }
            
            .mouth-open.speaking {
                animation: speak-animation-envy 0.4s infinite ease-in-out;
                transform-origin: center;
            }
             @keyframes speak-animation-envy {
              0%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(0.7); }
            }
            
            .mouth-open.listening {
                 transform: scale(1.1);
                 transition: transform 0.3s ease;
            }

            .thinking-waves circle {
              fill: #22d3ee;
              opacity: 0;
              transform-origin: center;
              animation: thinking-waves-animation 2s infinite ease-out;
            }
            .thinking-waves circle:nth-child(2) { animation-delay: 0.5s; }
            .thinking-waves circle:nth-child(3) { animation-delay: 1s; }
            @keyframes thinking-waves-animation {
              0% { transform: scale(0.9); opacity: 0.4; }
              100% { transform: scale(1.6); opacity: 0; }
            }

            .antenna-heart {
              animation: heart-pulse 2s infinite ease-in-out;
            }
            @keyframes heart-pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
          `}
        </style>
        
        {status === AvatarStatus.THINKING && (
          <g className="thinking-waves">
            <circle cx="100" cy="100" r="80" />
            <circle cx="100" cy="100" r="80" />
            <circle cx="100" cy="100" r="80" />
          </g>
        )}

        <g className={`robot-group ${status}`} filter="url(#soft-shadow)">
            {/* Head */}
            <path d="M 30 110 C 10 110, 10 50, 50 50 C 70 25, 130 25, 150 50 C 190 50, 190 110, 170 110 C 160 150, 40 150, 30 110 Z" fill="url(#robot-body-gradient)" />

            {/* Eyes */}
            <g className="eyes">
                <circle cx="70" cy="95" r="29" fill="white" />
                <circle cx="130" cy="95" r="29" fill="white" />
                <g className="blink">
                  <circle cx="70" cy="95" r="25" fill="url(#envy-eye-gradient)" />
                  <circle cx="130" cy="95" r="25" fill="url(#envy-eye-gradient)" />
                </g>
                 {/* Highlights & Sparkles */}
                <g fill="white">
                    <circle cx="78" cy="88" r="7" fillOpacity="0.9" />
                    <circle cx="138" cy="88" r="7" fillOpacity="0.9" />
                    <circle cx="65" cy="108" r="3" fillOpacity="0.7" />
                    <circle cx="125" cy="108" r="3" fillOpacity="0.7" />
                    <circle cx="85" cy="105" r="2" fillOpacity="0.8" />
                    <circle cx="145" cy="105" r="2" fillOpacity="0.8" />
                </g>
            </g>
             
            {/* Antennas */}
            {/* Right Antenna */}
            <path d="M145 50 Q 155 35, 165 25" stroke="#0D9488" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M165 25 L 164 24 C 158 12, 172 12, 166 28 Z" fill="url(#heart-gradient)" className="antenna-heart" transform="rotate(15, 165, 25)" />
            {/* Left Antenna */}
            <path d="M55 50 Q 45 35, 35 25" stroke="#0D9488" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M35 25 L 34 24 C 28 12, 42 12, 36 28 Z" fill="url(#heart-gradient)" className="antenna-heart" transform="rotate(-15, 35, 25)" />

            {/* Mouth */}
            <g>
                <path className="mouth-closed" d="M 95 122 Q 100 127, 105 122" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
                <ellipse className={`mouth-open ${status === 'speaking' ? 'speaking' : ''} ${status === 'listening' ? 'listening' : ''}`} cx="100" cy="124" rx="8" ry="5" fill="white" />
            </g>
        </g>
      </svg>
    </div>
  );
};
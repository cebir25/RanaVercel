import React, { useRef, useEffect, useState } from 'react';
import { TrashIcon, CameraIcon, PencilIcon, EraserIcon } from './icons';

type WhiteboardTranslations = {
  drawTool: string;
  eraserTool: string;
  colorTitle: (color: string) => string;
  clearCanvas: string;
  analyze: string;
  analyzeWithAI: string;
}

interface WhiteboardProps {
  onAnalyze: (dataUrl: string) => void;
  t: WhiteboardTranslations;
}

const COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#000000'];
const SIZES = [2, 5, 10, 20];

type Mode = 'draw' | 'eraser';

export const Whiteboard: React.FC<WhiteboardProps> = ({ onAnalyze, t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const penColorRef = useRef(COLORS[3]);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[3]);
  const [size, setSize] = useState(SIZES[1]);
  const [mode, setMode] = useState<Mode>('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    contextRef.current = context;

    const setCanvasDimensions = () => {
        const dpr = window.devicePixelRatio || 1;
        const parentElement = canvas.parentElement;
        if (!parentElement) return;

        const rect = parentElement.getBoundingClientRect();
        
         const hasContent = canvas.width > 0 && canvas.height > 0;
        const currentData = hasContent ? contextRef.current?.getImageData(0, 0, canvas.width, canvas.height) : null;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        context.scale(dpr, dpr);
        context.lineCap = 'round';
        context.strokeStyle = color;
        context.lineWidth = size;
        
       // Always fill with white background first
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Then restore previous content if it existed
        if (currentData && hasContent) {
            context.putImageData(currentData, 0, 0);
        }
    };

    setCanvasDimensions();

    const resizeObserver = new ResizeObserver(setCanvasDimensions);
    if(canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
    }
  }, [color]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = size;
    }
  }, [size]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'draw') {
        setColor(penColorRef.current);
    } else if (newMode === 'eraser') {
        setColor('#FFFFFF');
    }
  };

  const handleColorChange = (newColor: string) => {
      penColorRef.current = newColor;
      setColor(newColor);
      if (mode === 'eraser') {
          setMode('draw');
      }
  }

  const getCoords = (event: PointerEvent) => {
    const canvas = canvasRef.current;
    if(!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    return { 
        offsetX: event.clientX - rect.left, 
        offsetY: event.clientY - rect.top 
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoords(event.nativeEvent);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoords(event.nativeEvent);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };
  
  const handlePointerUp = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      const dpr = window.devicePixelRatio || 1;
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
  };

  const handleAnalyze = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onAnalyze(dataUrl);
    }
  };

  const getCursor = () => {
    if (mode === 'eraser') return 'cursor-grab';
    return 'cursor-crosshair';
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700 flex-wrap gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2">
           <button onClick={() => handleModeChange('draw')} className={`p-2 rounded-full transition-colors ${mode === 'draw' ? 'bg-cyan-500/20' : 'hover:bg-gray-700'}`} title={t.drawTool}>
                <PencilIcon className="w-5 h-5 text-gray-300" />
            </button>
            <button onClick={() => handleModeChange('eraser')} className={`p-2 rounded-full transition-colors ${mode === 'eraser' ? 'bg-cyan-500/20' : 'hover:bg-gray-700'}`} title={t.eraserTool}>
                <EraserIcon className="w-5 h-5 text-gray-300" />
            </button>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform duration-150 ${color === c && mode !== 'eraser' ? 'border-cyan-400 scale-110' : 'border-gray-600'}`}
                style={{ backgroundColor: c }}
                title={t.colorTitle(c)}
              />
            ))}
        </div>
         <div className="flex items-center space-x-1 sm:space-x-2">
            {SIZES.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={`p-2 rounded-full transition-colors ${size === s ? 'bg-cyan-500/20' : 'hover:bg-gray-700'}`}>
                    <span className="block rounded-full bg-gray-400" style={{width: s+2, height: s+2}}></span>
                </button>
            ))}
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={clearCanvas} className="p-2 text-gray-400 hover:text-white rounded-full bg-gray-700 hover:bg-gray-600 transition-colors" title={t.clearCanvas}>
            <TrashIcon className="w-5 h-5" />
          </button>
          <button onClick={handleAnalyze} className="flex items-center space-x-2 p-2 px-3 text-gray-900 bg-cyan-500 hover:bg-cyan-400 rounded-full font-semibold transition-colors" title={t.analyzeWithAI}>
            <CameraIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t.analyze}</span>
          </button>
        </div>
      </div>
      <div className="flex-1 w-full h-full relative bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerMove={handlePointerMove}
          className={`absolute top-0 left-0 ${getCursor()}`}
        />
      </div>
    </div>
  );
};

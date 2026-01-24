import React, { useRef, useState, useEffect } from 'react';
import { Annotation } from '../types';
import { IconCrop, IconX, IconCheck } from './Icons';

interface ImageEditorProps {
  imageSrc: string;
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  onImageUpdate: (newImageSrc: string) => void;
  activeTool: 'number' | 'text' | 'rect' | 'circle' | 'crop' | 'arrow';
  activeColor: string;
  activeStyle: 'outline' | 'fill';
}

const ImageEditor: React.FC<ImageEditorProps> = ({ 
  imageSrc, 
  annotations, 
  onChange, 
  onImageUpdate,
  activeTool, 
  activeColor,
  activeStyle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDragRect, setCurrentDragRect] = useState<{ x: number, y: number, w: number, h: number, endX?: number, endY?: number } | null>(null);
  
  // State for dragging existing annotations
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);

  // Helper: Get coordinates as percentage relative to the image container
  const getRelativeCoords = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  // Start Drawing (Background)
  const handleMouseDown = (e: React.MouseEvent) => {
    // If text is being edited, or dragging existing item, don't start drawing
    if ((e.target as HTMLElement).tagName === 'INPUT' || draggingId) return;
    
    e.preventDefault();
    const coords = getRelativeCoords(e);

    if (activeTool === 'number') {
      const existingNumbers = annotations
        .filter(a => a.type === 'number')
        .map(a => parseInt(a.text || '0', 10))
        .filter(n => !isNaN(n));
      const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'number',
        x: coords.x,
        y: coords.y,
        text: nextNum.toString(),
        color: activeColor,
      };
      onChange([...annotations, newAnnotation]);
    } else if (activeTool === 'text') {
        const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: 'text',
            x: coords.x,
            y: coords.y,
            text: 'Nhập chữ',
            color: activeColor,
            fontSize: 16
        };
        onChange([...annotations, newAnnotation]);
    } else {
      setIsDrawing(true);
      setDragStart(coords);
      setCurrentDragRect({ x: coords.x, y: coords.y, w: 0, h: 0, endX: coords.x, endY: coords.y });
    }
  };

  // Start Moving (Annotation)
  const handleAnnotationMouseDown = (e: React.MouseEvent, id: string, x: number, y: number) => {
      e.stopPropagation(); // Stop bubbling to background
      // Only move if not in crop mode
      if (activeTool === 'crop') return;

      const coords = getRelativeCoords(e);
      setDraggingId(id);
      setDragOffset({ x: coords.x - x, y: coords.y - y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getRelativeCoords(e);

    // Case 1: Dragging existing annotation
    if (draggingId && dragOffset) {
        e.preventDefault();
        const newX = coords.x - dragOffset.x;
        const newY = coords.y - dragOffset.y;
        
        onChange(annotations.map(a => a.id === draggingId ? { ...a, x: newX, y: newY } : a));
        return;
    }

    // Case 2: Drawing new shape
    if (!isDrawing || !dragStart) return;
    
    if (activeTool === 'arrow') {
        setCurrentDragRect({ 
            x: dragStart.x, y: dragStart.y, w: 0, h: 0, 
            endX: coords.x, endY: coords.y 
        });
    } else {
        const width = Math.abs(coords.x - dragStart.x);
        const height = Math.abs(coords.y - dragStart.y);
        const x = Math.min(coords.x, dragStart.x);
        const y = Math.min(coords.y, dragStart.y);
        setCurrentDragRect({ x, y, w: width, h: height });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // End dragging existing annotation
    if (draggingId) {
        setDraggingId(null);
        setDragOffset(null);
        return;
    }

    // End drawing new shape
    if (isDrawing && dragStart && currentDragRect) {
      if (activeTool === 'arrow') {
          const newAnnotation: Annotation = {
              id: Date.now().toString(),
              type: 'arrow',
              x: dragStart.x,
              y: dragStart.y,
              width: currentDragRect.endX, // End X
              height: currentDragRect.endY, // End Y
              color: activeColor,
          };
          onChange([...annotations, newAnnotation]);
      } else if (currentDragRect.w > 1 && currentDragRect.h > 1) {
          if (activeTool === 'crop') {
             // Crop handled by UI button overlay
          } else {
              const newAnnotation: Annotation = {
                  id: Date.now().toString(),
                  type: activeTool as 'rect' | 'circle',
                  x: currentDragRect.x,
                  y: currentDragRect.y,
                  width: currentDragRect.w,
                  height: currentDragRect.h,
                  color: activeColor,
                  style: activeStyle
              };
              onChange([...annotations, newAnnotation]);
          }
      }
      
      if (activeTool !== 'crop') {
        setIsDrawing(false);
        setDragStart(null);
        setCurrentDragRect(null);
      }
    }
  };

  const deleteAnnotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Critical: Stop triggering selection/drawing
    e.preventDefault();
    onChange(annotations.filter(a => a.id !== id));
  };

  const editNumber = (id: string) => {
      const ann = annotations.find(a => a.id === id);
      if (!ann) return;
      
      const newNum = prompt("Sửa số:", ann.text);
      if (newNum !== null) {
          onChange(annotations.map(a => a.id === id ? { ...a, text: newNum } : a));
      }
  };

  const performCrop = () => {
      if (!currentDragRect || !imgRef.current) return;
      const canvas = document.createElement('canvas');
      const img = imgRef.current;
      const scaleX = img.naturalWidth / 100;
      const scaleY = img.naturalHeight / 100;
      const cropX = currentDragRect.x * scaleX;
      const cropY = currentDragRect.y * scaleY;
      const cropW = currentDragRect.w * scaleX;
      const cropH = currentDragRect.h * scaleY;

      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          const newBase64 = canvas.toDataURL('image/png');
          setIsDrawing(false);
          setDragStart(null);
          setCurrentDragRect(null);
          onChange([]); 
          onImageUpdate(newBase64);
      }
  };

  const cancelCrop = () => {
    setIsDrawing(false);
    setDragStart(null);
    setCurrentDragRect(null);
  };

  const updateAnnotationText = (id: string, newText: string) => {
      onChange(annotations.map(a => a.id === id ? { ...a, text: newText } : a));
  };

  const DeleteButton = ({ onClick }: { onClick: (e: React.MouseEvent) => void }) => (
    <div 
        className="absolute -top-3 -right-3 btn btn-circle btn-xs bg-red-500 border-2 border-white text-white shadow-lg cursor-pointer z-50 hover:scale-110 hover:bg-red-600 transition-transform flex items-center justify-center"
        onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
        onClick={onClick}
        title="Xóa"
    >
        <IconX className="w-3 h-3 pointer-events-none" />
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block w-full h-auto select-none overflow-hidden rounded-xl group ${activeTool === 'crop' ? 'cursor-crosshair' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={activeTool !== 'crop' ? handleMouseUp : undefined}
      onMouseLeave={() => { if(activeTool !== 'crop') setIsDrawing(false); setDraggingId(null); }}
    >
      <img ref={imgRef} src={imageSrc} alt="Step" className="w-full h-auto block pointer-events-none" />
      
      {/* SVG Layer for Arrows */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
          <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
              </marker>
          </defs>
          {annotations.filter(a => a.type === 'arrow').map(ann => (
              <line 
                key={ann.id}
                x1={`${ann.x}%`} y1={`${ann.y}%`}
                x2={`${ann.width}%`} y2={`${ann.height}%`}
                stroke={ann.color || 'red'}
                strokeWidth="4"
                markerEnd="url(#arrowhead)"
                style={{ color: ann.color || 'red', filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))' }}
              />
          ))}
          {/* Preview Arrow */}
          {isDrawing && activeTool === 'arrow' && currentDragRect && (
              <line 
                x1={`${currentDragRect.x}%`} y1={`${currentDragRect.y}%`}
                x2={`${currentDragRect.endX}%`} y2={`${currentDragRect.endY}%`}
                stroke={activeColor}
                strokeWidth="4"
                markerEnd="url(#arrowhead)"
                style={{ color: activeColor }}
              />
          )}
      </svg>

      {/* HTML Layer for other annotations */}
      {annotations.map((ann) => {
        // Arrow Selection Area (Hitbox)
        if (ann.type === 'arrow') {
             const mx = (ann.x + (ann.width || 0)) / 2;
             const my = (ann.y + (ann.height || 0)) / 2;
             return (
                 <div 
                    key={ann.id} 
                    className="absolute w-8 h-8 z-30 group/ann cursor-move" 
                    style={{ left: `${mx}%`, top: `${my}%`, transform: 'translate(-50%, -50%)' }}
                    onMouseDown={(e) => handleAnnotationMouseDown(e, ann.id, mx, my)} // Allow moving arrow by center point
                 >
                     <div className="w-full h-full bg-white/20 border border-dashed border-white rounded-full hover:bg-white/40 shadow-sm" />
                     <div className="hidden group-hover/ann:block">
                         <DeleteButton onClick={(e) => deleteAnnotation(ann.id, e)} />
                     </div>
                 </div>
             )
        }

        // Number Badge
        if (ann.type === 'number') {
          return (
            <div
              key={ann.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 font-bold rounded-full border-2 border-white shadow-xl cursor-move group/ann z-20 hover:scale-110 transition-transform"
              style={{ left: `${ann.x}%`, top: `${ann.y}%`, backgroundColor: ann.color || '#f97316', color: 'white' }}
              onMouseDown={(e) => handleAnnotationMouseDown(e, ann.id, ann.x, ann.y)}
              onDoubleClick={() => editNumber(ann.id)}
              title="Kéo để di chuyển, Nhấp đúp để sửa số"
            >
              {ann.text}
              <div className="hidden group-hover/ann:block">
                 <DeleteButton onClick={(e) => deleteAnnotation(ann.id, e)} />
              </div>
            </div>
          );
        } 
        
        // Text
        if (ann.type === 'text') {
            return (
                <div
                  key={ann.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group/ann z-20 cursor-move"
                  style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                  onMouseDown={(e) => {
                      if((e.target as HTMLElement).tagName !== 'INPUT') {
                         handleAnnotationMouseDown(e, ann.id, ann.x, ann.y)
                      }
                  }}
                >
                    <input 
                        type="text"
                        value={ann.text}
                        onChange={(e) => updateAnnotationText(ann.id, e.target.value)}
                        className="bg-transparent border-2 border-transparent hover:border-dashed hover:border-white focus:border-indigo-400 rounded px-2 text-xl font-bold outline-none shadow-sm cursor-text transition-all"
                        style={{ color: ann.color || '#ef4444', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    />
                     <div className="hidden group-hover/ann:block">
                        <DeleteButton onClick={(e) => deleteAnnotation(ann.id, e)} />
                     </div>
                </div>
            );
        }

        // Shapes (Rect/Circle)
        const isRect = ann.type === 'rect';
        const isCircle = ann.type === 'circle';
        if (isRect || isCircle) {
          return (
            <div
              key={ann.id}
              className={`absolute cursor-move group/ann z-10 ${isCircle ? 'rounded-full' : 'rounded-lg'}`}
              style={{
                left: `${ann.x}%`,
                top: `${ann.y}%`,
                width: `${ann.width}%`,
                height: `${ann.height}%`,
                borderColor: ann.color || '#f97316',
                backgroundColor: ann.style === 'fill' ? (ann.color || '#f97316') : 'transparent',
                borderWidth: ann.style === 'outline' ? '4px' : '0',
                opacity: ann.style === 'fill' ? 0.3 : 1,
                boxShadow: ann.style === 'outline' ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
              }}
              onMouseDown={(e) => handleAnnotationMouseDown(e, ann.id, ann.x, ann.y)}
            >
                 <div className="hidden group-hover/ann:block">
                    <DeleteButton onClick={(e) => deleteAnnotation(ann.id, e)} />
                 </div>
            </div>
          );
        }
        return null;
      })}

      {/* Dragging Preview (Shapes) */}
      {isDrawing && currentDragRect && activeTool !== 'crop' && activeTool !== 'arrow' && (
          <div 
            className={`absolute border-4 ${activeTool === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
            style={{
                left: `${currentDragRect.x}%`,
                top: `${currentDragRect.y}%`,
                width: `${currentDragRect.w}%`,
                height: `${currentDragRect.h}%`,
                borderColor: activeColor,
                backgroundColor: activeStyle === 'fill' ? activeColor : 'transparent',
                opacity: activeStyle === 'fill' ? 0.3 : 0.7,
                borderStyle: 'solid'
            }}
          />
      )}

      {/* Crop Overlay */}
      {currentDragRect && activeTool === 'crop' && (
         <>
            <div className="absolute inset-0 bg-slate-900/60 z-30 pointer-events-none" />
            <div 
                className="absolute z-40 border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                style={{
                    left: `${currentDragRect.x}%`,
                    top: `${currentDragRect.y}%`,
                    width: `${currentDragRect.w}%`,
                    height: `${currentDragRect.h}%`,
                    cursor: 'crosshair',
                }}
            />
            {/* Toolbar - Smart positioned */}
            <div 
                className="absolute z-50 flex gap-3 bg-slate-800 p-2 rounded-xl shadow-2xl transform -translate-x-1/2 border border-slate-700"
                style={{
                    left: `${currentDragRect.x + currentDragRect.w / 2}%`,
                    top: (currentDragRect.y + currentDragRect.h > 80) 
                         ? `calc(${currentDragRect.y}% - 60px)` 
                         : `calc(${currentDragRect.y + currentDragRect.h}% + 16px)`,
                    pointerEvents: 'auto'
                }}
                onMouseDown={(e) => e.stopPropagation()} 
                onMouseUp={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={performCrop} 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg"
                >
                    <IconCheck className="w-4 h-4" /> Áp dụng
                </button>
                <button 
                    onClick={cancelCrop} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-sm transition-colors"
                >
                    <IconX className="w-4 h-4" /> Hủy
                </button>
            </div>
         </>
      )}
    </div>
  );
};

export default ImageEditor;
import React, { useState, useRef, useEffect } from 'react';
import { DocStep, ProjectMetadata, Annotation, Guide } from '../types';
import ImageEditor from './ImageEditor';
import { analyzeScreenshot, generateStepDescription } from '../services/geminiService';
import ChatAssistant from './ChatAssistant';
import { IconPlus, IconTrash, IconDownload, IconCamera, IconWand, IconArrowUp, IconArrowDown, IconGlobe, IconType, IconSquare, IconCircle, IconCrop, IconFileCode, IconFileText, IconArrowRight, IconUndo, IconRedo, IconEye, IconX, IconList, IconRefresh, IconImage, IconSparkles, IconCopy, IconCheck, IconSave, IconHome, IconBold, IconItalic, IconIndent, IconOutdent } from './Icons';

// --- Simple WYSIWYG Editor ---
const SimpleEditor = ({ value, onChange, placeholder, className }: { value: string, onChange: (val: string) => void, placeholder: string, className?: string }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [activeFormats, setActiveFormats] = useState<string[]>([]);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            checkFormats();
        }
    };

    const checkFormats = () => {
        const formats: string[] = [];
        if (document.queryCommandState('bold')) formats.push('bold');
        if (document.queryCommandState('italic')) formats.push('italic');
        if (document.queryCommandState('insertUnorderedList')) formats.push('list');
        setActiveFormats(formats);
    };

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
            onChange(editorRef.current.innerHTML);
            checkFormats();
        }
    };

    return (
        <div className={`border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm ${className}`}>
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
                <button 
                    onClick={() => exec('bold')} 
                    className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${activeFormats.includes('bold') ? 'bg-slate-200 text-indigo-600' : ''}`}
                    title="In đậm"
                >
                    <IconBold className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => exec('italic')} 
                    className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${activeFormats.includes('italic') ? 'bg-slate-200 text-indigo-600' : ''}`}
                    title="In nghiêng"
                >
                    <IconItalic className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button 
                    onClick={() => exec('insertUnorderedList')} 
                    className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${activeFormats.includes('list') ? 'bg-slate-200 text-indigo-600' : ''}`}
                    title="Danh sách"
                >
                    <IconList className="w-4 h-4" />
                </button>
            </div>
            <div 
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyUp={checkFormats}
                onMouseUp={checkFormats}
                className="p-4 min-h-[100px] outline-none text-slate-600 leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-2 font-sans"
                style={{ whiteSpace: 'pre-wrap' }}
                data-placeholder={placeholder}
            />
        </div>
    )
}

const renderStepToCanvas = async (step: DocStep): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(step.image);

            // Use natural dimensions for high quality
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Calculate scale factor to keep annotations proportional regardless of image resolution
            // We assume base designs are around 1000px wide roughly, so we scale line widths
            const scaleFactor = Math.max(1, canvas.width / 1200);

            step.annotations.forEach(ann => {
                const x = (ann.x / 100) * canvas.width;
                const y = (ann.y / 100) * canvas.height;
                const w = (ann.width ? ann.width / 100 : 0) * canvas.width;
                const h = (ann.height ? ann.height / 100 : 0) * canvas.height;

                ctx.beginPath(); // Critical: Reset path for each shape
                
                ctx.strokeStyle = ann.color || '#ff0000';
                ctx.fillStyle = ann.color || '#ff0000';
                ctx.lineWidth = 5 * scaleFactor;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                if (ann.type === 'arrow') {
                    // Arrow coordinates in data: x/y is Start, width/height is End (percent)
                    const startX = x;
                    const startY = y;
                    // Note: width/height in arrow Annotation are actually the End X/Y percentages
                    const endX = (ann.width || 0) / 100 * canvas.width; 
                    const endY = (ann.height || 0) / 100 * canvas.height;
                    
                    const headLen = 20 * scaleFactor;
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const angle = Math.atan2(dy, dx);

                    // Draw line
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    // Draw arrowhead
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
                    ctx.lineTo(endX, endY);
                    ctx.fill();

                } else if (ann.type === 'rect') {
                    if (ann.style === 'fill') {
                        ctx.globalAlpha = 0.3;
                        ctx.fillRect(x, y, w, h);
                        ctx.globalAlpha = 1.0;
                    } else {
                        ctx.strokeRect(x, y, w, h);
                    }
                } else if (ann.type === 'circle') {
                    ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, 2 * Math.PI);
                    if (ann.style === 'fill') {
                         ctx.globalAlpha = 0.3;
                         ctx.fill();
                         ctx.globalAlpha = 1.0;
                    } else {
                        ctx.stroke();
                    }
                } else if (ann.type === 'number') {
                    const radius = 24 * scaleFactor; 
                    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2 * scaleFactor;
                    ctx.stroke();

                    ctx.fillStyle = 'white';
                    ctx.font = `bold ${24 * scaleFactor}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(ann.text || '', x, y);
                } else if (ann.type === 'text') {
                     ctx.font = `bold ${32 * scaleFactor}px Arial`;
                     ctx.textAlign = 'center';
                     ctx.fillText(ann.text || '', x, y);
                     
                     ctx.strokeStyle = 'white';
                     ctx.lineWidth = 4 * scaleFactor;
                     ctx.strokeText(ann.text || '', x, y);
                     
                     ctx.fillStyle = ann.color || '#ff0000';
                     ctx.fillText(ann.text || '', x, y);
                }
            });

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(step.image); // Fallback
        img.src = step.image;
    });
};

const DocumentPreview = ({ 
    steps, 
    metadata, 
    onClose, 
    onUpdateStep,
    onExportHTML,
    onExportDOCX,
    onCopy
}: { 
    steps: DocStep[], 
    metadata: ProjectMetadata, 
    onClose: () => void,
    onUpdateStep: (id: string, data: Partial<DocStep>) => void,
    onExportHTML: (includeTOC: boolean) => void,
    onExportDOCX: (includeTOC: boolean) => void,
    onCopy: (includeTOC: boolean) => Promise<boolean>
}) => {
    const [includeTOC, setIncludeTOC] = useState(true);
    const [isCopying, setIsCopying] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    
    // Cache generated images to prevent flickering during text edits
    const [renderedImages, setRenderedImages] = useState<Record<string, string>>({});

    useEffect(() => {
        const renderImages = async () => {
            const newImages: Record<string, string> = {};
            for (const step of steps) {
                if (!renderedImages[step.id]) {
                    newImages[step.id] = await renderStepToCanvas(step);
                }
            }
            if (Object.keys(newImages).length > 0) {
                setRenderedImages(prev => ({...prev, ...newImages}));
            }
        };
        renderImages();
    }, [steps]);

    const handleAction = async (action: 'copy' | 'html' | 'docx') => {
        setIsPreparing(true);
        // Force a tiny delay to show loading state
        await new Promise(r => setTimeout(r, 50));
        try {
            if (action === 'copy') {
                const success = await onCopy(includeTOC);
                if (success) {
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                }
            } else if (action === 'html') {
                await onExportHTML(includeTOC);
            } else if (action === 'docx') {
                await onExportDOCX(includeTOC);
            }
        } finally {
            setIsPreparing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-base-200/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
            <div className="navbar bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 shrink-0 h-16 shadow-sm z-20">
                <div className="flex-1 gap-4">
                     <h2 className="font-bold text-xl text-indigo-900 flex items-center gap-2">
                        <span className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-pink-500 rounded-full"></span>
                        Trình soạn thảo văn bản
                     </h2>
                     {isPreparing && <span className="loading loading-spinner text-primary loading-sm"></span>}
                </div>
                
                <div className="flex-none gap-3">
                    <button 
                        onClick={() => handleAction('copy')} 
                        disabled={isCopying || isPreparing}
                        className={`btn btn-sm rounded-full gap-2 border-none shadow-lg transition-all ${
                            copySuccess 
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                            : 'bg-teal-500 text-white hover:bg-teal-600 hover:shadow-teal-500/30'
                        }`}
                    >
                        {copySuccess ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                        {copySuccess ? 'Đã sao chép!' : 'Sao chép Docs'}
                    </button>

                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    <button onClick={() => handleAction('html')} disabled={isPreparing} className="btn btn-outline btn-primary btn-sm rounded-full gap-2">
                        <IconFileCode className="w-4 h-4" /> HTML
                    </button>
                    <button onClick={() => handleAction('docx')} disabled={isPreparing} className="btn btn-primary btn-sm rounded-full gap-2 text-white shadow-lg border-none gradient-bg">
                        <IconFileText className="w-4 h-4" /> DOCX
                    </button>
                    <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                        <IconX className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-80 bg-white border-r border-indigo-50 h-full overflow-y-auto p-6 hidden lg:block shrink-0 custom-scrollbar">
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                        <IconList className="w-4 h-4" /> Mục lục
                    </h3>
                    <ul className="space-y-2 relative">
                         <div className="absolute left-[15px] top-4 bottom-4 w-px bg-indigo-50 -z-10"></div>
                        {steps.map((step, idx) => (
                            <li key={step.id} style={{ paddingLeft: `${step.indentation * 12}px` }}>
                                <a href={`#step-${step.id}`} className="flex items-start gap-3 group p-2 rounded-xl hover:bg-indigo-50 transition-all">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all z-10">
                                        {idx + 1}
                                    </span>
                                    <div className="pt-1">
                                        <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-900 block leading-tight mb-1 truncate">{step.title}</span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-50/50 scroll-smooth">
                    <div className="w-[850px] bg-white shadow-xl p-16 min-h-screen rounded-3xl border border-white mb-20">
                        <div className="text-center border-b-2 border-indigo-100 pb-8 mb-8">
                            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">{metadata.title}</h1>
                            <div className="text-slate-500 font-medium">
                                Tác giả: {metadata.author} • {metadata.date}
                            </div>
                        </div>
                        
                        {steps.map((step, idx) => (
                             <div key={step.id} id={`step-${step.id}`} className="mb-20 break-inside-avoid scroll-mt-24 group" style={{ marginLeft: `${step.indentation * 40}px` }}>
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 text-lg font-bold shrink-0 select-none">{idx + 1}</span>
                                    
                                    <div className="flex-1">
                                        <select 
                                            value={step.headingLevel || 'h2'}
                                            onChange={(e) => onUpdateStep(step.id, { headingLevel: e.target.value as any })}
                                            className="select select-ghost select-xs text-slate-400 font-bold uppercase tracking-wider mb-1"
                                        >
                                            <option value="h1">Heading 1</option>
                                            <option value="h2">Heading 2</option>
                                            <option value="h3">Heading 3</option>
                                        </select>
                                        <input 
                                            value={step.title}
                                            onChange={(e) => onUpdateStep(step.id, { title: e.target.value })}
                                            className={`w-full bg-transparent border-none outline-none font-bold text-slate-800 placeholder-slate-300 focus:ring-0 p-0 ${step.headingLevel === 'h1' ? 'text-4xl' : step.headingLevel === 'h2' ? 'text-3xl' : 'text-2xl'}`}
                                            placeholder="Tiêu đề bước..."
                                        />
                                    </div>
                                </div>
                                
                                <div className="relative inline-block mb-8 border-4 border-slate-100 rounded-xl overflow-hidden shadow-lg max-w-full">
                                    {renderedImages[step.id] ? (
                                        <img src={renderedImages[step.id]} alt="step" className="max-w-full h-auto block" />
                                    ) : (
                                        <div className="w-full h-64 bg-slate-100 animate-pulse flex items-center justify-center text-slate-300">Đang tạo ảnh...</div>
                                    )}
                                </div>
                                
                                <SimpleEditor 
                                    value={step.description}
                                    onChange={(val) => onUpdateStep(step.id, { description: val })}
                                    placeholder="Viết mô tả..."
                                    className="border-l-4 border-l-indigo-500 rounded-none rounded-r-xl border-t-0 border-b-0 border-r-0 shadow-none bg-slate-50"
                                />
                            </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

interface GuideEditorProps {
    initialGuide: Guide | null;
    onSave: (guide: Guide) => void;
    onBack: () => void;
}

export default function GuideEditor({ initialGuide, onSave, onBack }: GuideEditorProps) {
  const [steps, setSteps] = useState<DocStep[]>(initialGuide?.steps || []);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(initialGuide?.steps[0]?.id || null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  const [guideId] = useState<string>(() => initialGuide?.id || Date.now().toString());
  
  const [history, setHistory] = useState<{ past: Annotation[][], future: Annotation[][] }>({ past: [], future: [] });

  const [activeTool, setActiveTool] = useState<'number' | 'text' | 'rect' | 'circle' | 'crop' | 'arrow'>('number');
  const [activeColor, setActiveColor] = useState('#6366f1');
  const [activeStyle, setActiveStyle] = useState<'outline' | 'fill'>('outline');

  const [metadata, setMetadata] = useState<ProjectMetadata>(initialGuide?.metadata || {
    title: 'Hướng dẫn mới',
    author: 'Tác giả',
    date: new Date().toLocaleDateString('vi-VN'),
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  
  const captureVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setHistory({ past: [], future: [] });
  }, [selectedStepId]);

  const handleManualSave = () => {
      setSaveStatus('saving');
      const guideToSave: Guide = {
          id: guideId, 
          metadata,
          steps,
          lastModified: Date.now()
      };
      onSave(guideToSave);
      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus('idle'), 2000);
  };
  
  const captureFrameFromStream = async (stream: MediaStream): Promise<string> => {
      return new Promise((resolve, reject) => {
          const video = captureVideoRef.current;
          if (!video) {
              stream.getTracks().forEach(t => t.stop());
              return reject("No video element");
          }
          
          video.srcObject = stream;
          video.onloadedmetadata = () => {
              video.play().then(() => {
                  setTimeout(() => {
                      const currentVideo = captureVideoRef.current;
                      if (!currentVideo) {
                          stream.getTracks().forEach(t => t.stop());
                          return reject("Video element unmounted");
                      }
                      const canvas = document.createElement('canvas');
                      canvas.width = currentVideo.videoWidth;
                      canvas.height = currentVideo.videoHeight;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                          ctx.drawImage(currentVideo, 0, 0);
                          const data = canvas.toDataURL('image/png');
                          stream.getTracks().forEach(t => t.stop());
                          currentVideo.srcObject = null;
                          resolve(data);
                      } else {
                          stream.getTracks().forEach(t => t.stop());
                          reject("Canvas context missing");
                      }
                  }, 200); 
              }).catch(e => {
                  stream.getTracks().forEach(t => t.stop());
                  reject(e);
              });
          };
      });
  };

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any
      });
      const base64Image = await captureFrameFromStream(stream);
      addStep(base64Image);
    } catch (err) {
      console.error("Screen capture failed:", err);
    }
  };

  const handleReplaceCapture = async () => {
      if (!selectedStepId) return;
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: 'screen' } as any
        });
        const base64Image = await captureFrameFromStream(stream);
        updateStep(selectedStepId, { image: base64Image });
      } catch (err) {
        console.error("Replace capture failed:", err);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => addStep(event.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleReplaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStepId) return;
    const reader = new FileReader();
    reader.onload = (event) => updateStep(selectedStepId, { image: event.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addStep = async (base64Image: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newStep: DocStep = {
      id: id,
      image: base64Image,
      title: 'Đang xử lý...',
      description: 'Đang phân tích...',
      headingLevel: 'h2', 
      indentation: 0,
      annotations: [],
      isProcessing: true,
    };
    setSteps(prev => {
        const updated = [...prev, newStep];
        if (updated.length === 1) setSelectedStepId(id);
        return updated;
    });
    processStepAI(id, base64Image);
  };

  const processStepAI = async (id: string, image: string) => {
    try {
        const analysis = await analyzeScreenshot(image);
        setSteps(prev => prev.map(s => 
          s.id === id ? { ...s, title: analysis.title, description: analysis.description, isProcessing: false } : s
        ));
    } catch (e) {
        setSteps(prev => prev.map(s => 
            s.id === id ? { ...s, title: 'Bước đã chụp', description: 'Phân tích thất bại.', isProcessing: false } : s
        ));
    }
  };

  const handleAiDescription = async () => {
    if(!selectedStepId || isAiGenerating) return;
    const step = steps.find(s => s.id === selectedStepId);
    if (!step) return;

    setIsAiGenerating(true);
    const newDesc = await generateStepDescription(step.image, step.title, step.description);
    updateStep(selectedStepId, { description: newDesc });
    setIsAiGenerating(false);
  };

  const deleteStep = (id: string) => {
    setSteps(prev => {
      const newSteps = prev.filter(s => s.id !== id);
      if (selectedStepId === id) setSelectedStepId(newSteps.length > 0 ? newSteps[0].id : null);
      return newSteps;
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const changeIndentation = (index: number, direction: 'in' | 'out') => {
    const step = steps[index];
    let newLevel = step.indentation + (direction === 'in' ? 1 : -1);
    newLevel = Math.max(0, Math.min(2, newLevel)); 
    
    const newSteps = [...steps];
    newSteps[index] = { ...step, indentation: newLevel };
    setSteps(newSteps);
  };

  const updateStep = (id: string, updates: Partial<DocStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateAnnotationsWithHistory = (newAnnotations: Annotation[]) => {
      if (!selectedStepId) return;
      const step = steps.find(s => s.id === selectedStepId);
      if (!step) return;
      setHistory(prev => ({ past: [...prev.past, step.annotations], future: [] }));
      updateStep(selectedStepId, { annotations: newAnnotations });
  };

  const handleUndo = () => {
      if (!selectedStepId || history.past.length === 0) return;
      const step = steps.find(s => s.id === selectedStepId);
      if (!step) return;
      const previous = history.past[history.past.length - 1];
      setHistory({ past: history.past.slice(0, -1), future: [step.annotations, ...history.future] });
      updateStep(selectedStepId, { annotations: previous });
  };

  const handleRedo = () => {
      if (!selectedStepId || history.future.length === 0) return;
      const step = steps.find(s => s.id === selectedStepId);
      if (!step) return;
      const next = history.future[0];
      setHistory(prev => ({ past: [...prev.past, step.annotations], future: history.future.slice(1) }));
      updateStep(selectedStepId, { annotations: next });
  };

  const generateDocumentContent = async (includeTOC: boolean): Promise<string> => {
      let content = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>${metadata.title}</title>
          <style>
              body { font-family: sans-serif; max-width: 800px; margin: 40px auto; color: #333; line-height: 1.6; }
              h1 { font-size: 32px; border-bottom: 2px solid #eee; padding-bottom: 20px; color: #111; }
              .meta { color: #666; font-size: 14px; margin-bottom: 40px; }
              .step { margin-bottom: 60px; page-break-inside: avoid; }
              .step h2 { font-size: 24px; margin-bottom: 20px; color: #222; }
              .step img { max-width: 100%; height: auto; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
              .step-desc { font-size: 16px; color: #444; background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1; }
              .toc { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 40px; }
              .toc h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
              .toc ul { list-style: none; padding: 0; }
              .toc li { margin-bottom: 8px; }
              .toc a { text-decoration: none; color: #475569; font-weight: 500; }
              .toc a:hover { color: #6366f1; }
          </style>
      </head>
      <body>
          <h1>${metadata.title}</h1>
          <div class="meta">
              Tác giả: ${metadata.author} • ${metadata.date}
          </div>
      `;
  
      if (includeTOC) {
          content += `
          <div class="toc">
              <h3>Mục lục</h3>
              <ul>
                  ${steps.map((step, i) => `
                      <li style="padding-left: ${step.indentation * 15}px">
                          <a href="#step-${step.id}">${i + 1}. ${step.title}</a>
                      </li>
                  `).join('')}
              </ul>
          </div>
          `;
      }
  
      for (const [index, step] of steps.entries()) {
          const markedImage = await renderStepToCanvas(step);
          const HeadingTag = step.headingLevel || 'h2';
          content += `
          <div class="step" id="step-${step.id}" style="margin-left: ${step.indentation * 20}px">
              <${HeadingTag}>${index + 1}. ${step.title}</${HeadingTag}>
              <img src="${markedImage}" alt="${step.title}" />
              <div class="step-desc">
                  ${step.description}
              </div>
          </div>
          `;
      }
  
      content += `</body></html>`;
      return content;
  };

  const handleExportHTML = async (includeTOC: boolean) => {
    const htmlContent = await generateDocumentContent(includeTOC);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDOCX = async (includeTOC: boolean) => {
    const htmlContent = await generateDocumentContent(includeTOC);
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (includeTOC: boolean): Promise<boolean> => {
    try {
        const htmlContent = await generateDocumentContent(includeTOC);
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([metadata.title + '\n\n' + steps.map(s => s.title + '\n' + s.description.replace(/<[^>]+>/g, '')).join('\n\n')], { type: 'text/plain' });
        
        const ClipboardItem = (window as any).ClipboardItem;
        if (ClipboardItem) {
            const item = new ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText
            });
            await navigator.clipboard.write([item]);
        } else {
             await navigator.clipboard.writeText(await blobText.text());
        }
        return true;
    } catch (err) {
        console.error("Copy failed", err);
        return false;
    }
  };

  const selectedStep = steps.find(s => s.id === selectedStepId);

  return (
    <div className="flex h-screen w-full bg-base-200 font-sans text-slate-800">
      
      <ChatAssistant />

      {isPreviewMode && (
          <DocumentPreview 
            steps={steps} 
            metadata={metadata} 
            onClose={() => setIsPreviewMode(false)} 
            onUpdateStep={updateStep}
            onExportHTML={handleExportHTML}
            onExportDOCX={handleExportDOCX}
            onCopy={handleCopy}
          />
      )}

      {/* Sidebar hidden by design in App.tsx when currentView is editor, or handled there */}
      {/* Editor Content */}
      <div className="w-80 flex flex-col z-20 h-full p-4 pr-0">
         <div className="bg-white rounded-3xl shadow-soft h-full flex flex-col overflow-hidden border border-white/50">
            <div className="p-6 border-b border-indigo-50 bg-gradient-to-r from-white to-indigo-50/30">
                 <button onClick={onBack} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 mb-2 flex items-center gap-1">
                     <IconHome className="w-3 h-3" /> Bảng điều khiển
                 </button>
                 <h1 className="text-2xl font-black gradient-text flex items-center gap-2 tracking-tight">
                    <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm shadow-lg shadow-indigo-300">FS</span> 
                    FlowSteps AI
                 </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {steps.map((step, index) => (
                    <div 
                      key={step.id}
                      onClick={() => setSelectedStepId(step.id)}
                      className={`relative p-3 rounded-2xl transition-all cursor-pointer group border ${
                        selectedStepId === step.id 
                        ? 'border-indigo-200 bg-indigo-50 shadow-md scale-[1.02]' 
                        : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-100'
                      }`}
                      style={{ marginLeft: `${(step.indentation || 0) * 16}px` }}
                    >
                        <div className="flex gap-3 items-start">
                             <div className={`w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold ${selectedStepId === step.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
                                {index + 1}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-sm truncate ${selectedStepId === step.id ? 'text-indigo-900' : 'text-slate-700'}`}>{step.title}</h3>
                                <p className="text-xs opacity-60 truncate mt-0.5">{step.isProcessing ? '✨ Đang phân tích...' : step.description.replace(/<[^>]+>/g, '')}</p>
                             </div>
                        </div>
                         
                         <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 bg-white rounded-full shadow-sm border border-slate-100 p-0.5 scale-90">
                             <button onClick={(e) => { e.stopPropagation(); changeIndentation(index, 'out'); }} className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="Thụt lề ra"><IconOutdent className="w-3 h-3" /></button>
                             <button onClick={(e) => { e.stopPropagation(); changeIndentation(index, 'in'); }} className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="Thụt lề vào"><IconIndent className="w-3 h-3" /></button>
                             
                             <div className="w-px h-3 bg-slate-200 mx-0.5 my-auto"></div>

                             <button onClick={(e) => { e.stopPropagation(); moveStep(index, 'up'); }} className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"><IconArrowUp className="w-3 h-3" /></button>
                             <button onClick={(e) => { e.stopPropagation(); moveStep(index, 'down'); }} className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"><IconArrowDown className="w-3 h-3" /></button>
                             <button onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }} className="p-1 hover:text-red-500 hover:bg-red-50 rounded-full"><IconTrash className="w-3 h-3" /></button>
                         </div>
                    </div>
                  ))}
                  
                  <div className="mt-4">
                      <button onClick={handleCapture} className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-2 group">
                            <IconCamera className="w-5 h-5" />
                            <span className="text-xs font-bold">Chụp màn hình</span>
                      </button>
                  </div>
            </div>

            <div className="p-4 border-t border-indigo-50 bg-slate-50/50">
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-block bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 rounded-xl shadow-sm gap-2 normal-case font-semibold">
                    <IconPlus className="w-4 h-4"/> Tải ảnh lên
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="h-20 flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex-1">
            <input 
                value={metadata.title}
                onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                className="input input-ghost text-2xl font-black text-slate-800 w-full max-w-lg px-0 hover:bg-transparent focus:bg-transparent placeholder:text-slate-300"
                placeholder="Đặt tên hướng dẫn..."
            />
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-full shadow-soft border border-indigo-50">
             <div className="flex gap-1 px-2 border-r border-slate-100">
                 {[
                    { id: 'number', icon: <span className="font-bold text-xs">1</span> },
                    { id: 'arrow', icon: <IconArrowRight className="w-4 h-4" /> },
                    { id: 'text', icon: <IconType className="w-4 h-4" /> },
                    { id: 'rect', icon: <IconSquare className="w-4 h-4" /> },
                    { id: 'circle', icon: <IconCircle className="w-4 h-4" /> },
                 ].map((tool) => (
                    <button 
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id as any)} 
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${activeTool === tool.id ? 'bg-slate-900 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                    >
                        {tool.icon}
                    </button>
                 ))}
                 <button onClick={() => setActiveTool('crop')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ml-1 ${activeTool === 'crop' ? 'bg-red-500 text-white shadow-md' : 'text-red-400 hover:bg-red-50'}`}>
                    <IconCrop className="w-4 h-4" />
                 </button>
             </div>
             
             <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                <div className="relative w-6 h-6 rounded-full overflow-hidden ring-2 ring-offset-1 ring-slate-200 cursor-pointer hover:ring-indigo-400 transition-all">
                    <input type="color" value={activeColor} onChange={(e) => setActiveColor(e.target.value)} className="absolute -top-2 -left-2 w-10 h-10 p-0 border-0 cursor-pointer"/>
                </div>
                <button onClick={() => setActiveStyle(activeStyle === 'fill' ? 'outline' : 'fill')} className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 px-2 py-1 rounded text-slate-500 hover:bg-slate-200">
                    {activeStyle === 'fill' ? 'Đầy' : 'Viền'}
                </button>
             </div>

             <div className="flex gap-1 px-2 border-r border-slate-100 mr-2">
                 <button onClick={handleUndo} disabled={history.past.length === 0} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"><IconUndo className="w-4 h-4" /></button>
                 <button onClick={handleRedo} disabled={history.future.length === 0} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"><IconRedo className="w-4 h-4" /></button>
             </div>

             <button onClick={handleManualSave} className={`btn btn-sm btn-ghost gap-2 rounded-full ${saveStatus === 'saved' ? 'text-green-600' : 'text-slate-600'}`}>
                 {saveStatus === 'saved' ? <IconCheck className="w-4 h-4" /> : <IconSave className="w-4 h-4" />}
                 {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? 'Đã lưu' : 'Lưu'}
             </button>

             <button onClick={() => setIsPreviewMode(true)} className="btn btn-primary rounded-full px-6 shadow-glow border-none gradient-bg text-white ml-2">
                <IconEye className="w-4 h-4" /> Xem trước
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
            {selectedStep ? (
                <div className="card w-full max-w-5xl bg-white shadow-xl rounded-[2rem] min-h-[800px] transition-all border border-white/60 mb-20">
                    <div className="card-body p-10">
                        <div className="flex flex-col gap-2 mb-8">
                            <div className="flex justify-between items-center pb-2">
                                <span className="badge badge-lg bg-indigo-50 text-indigo-700 border-none font-bold uppercase tracking-widest text-xs py-3 px-4">Bước {steps.findIndex(s => s.id === selectedStep.id) + 1}</span>
                                <button 
                                    onClick={async () => {
                                        updateStep(selectedStep.id, { isProcessing: true });
                                        const res = await analyzeScreenshot(selectedStep.image);
                                        updateStep(selectedStep.id, { title: res.title, description: res.description, isProcessing: false });
                                    }}
                                    className="btn btn-ghost btn-sm text-indigo-600 gap-2 hover:bg-indigo-50 rounded-full font-semibold"
                                >
                                    <IconWand className="w-4 h-4" /> AI Phân tích lại
                                </button>
                            </div>
                            
                            <div className="flex gap-2 items-center w-full">
                                <select 
                                    value={selectedStep.headingLevel || 'h2'}
                                    onChange={(e) => updateStep(selectedStep.id, { headingLevel: e.target.value as any })}
                                    className="select select-bordered select-sm w-24 bg-slate-50 font-bold text-slate-600"
                                    title="Heading Level"
                                >
                                    <option value="h1">H1</option>
                                    <option value="h2">H2</option>
                                    <option value="h3">H3</option>
                                    <option value="h4">H4</option>
                                    <option value="h5">H5</option>
                                    <option value="h6">H6</option>
                                </select>
                                <input 
                                    value={selectedStep.title}
                                    onChange={(e) => updateStep(selectedStep.id, { title: e.target.value })}
                                    className="input input-ghost text-4xl font-black w-full px-2 focus:bg-slate-50 text-slate-800 placeholder:text-slate-200"
                                    placeholder="Bước này làm gì?"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mb-2">
                             <input type="file" ref={replaceFileInputRef} className="hidden" accept="image/*" onChange={handleReplaceUpload} />
                             <button onClick={() => replaceFileInputRef.current?.click()} className="btn btn-sm bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-sm gap-2 rounded-full">
                                <IconImage className="w-4 h-4" /> Thay ảnh
                             </button>
                             <button onClick={handleReplaceCapture} className="btn btn-sm bg-white border border-slate-200 text-indigo-600 hover:border-indigo-300 shadow-sm gap-2 rounded-full">
                                <IconRefresh className="w-4 h-4" /> Chụp lại
                             </button>
                        </div>

                        <div className="group relative rounded-2xl overflow-hidden border-4 border-slate-100 bg-slate-50 shadow-inner">
                             <ImageEditor 
                                imageSrc={selectedStep.image}
                                annotations={selectedStep.annotations}
                                onChange={(anns) => updateAnnotationsWithHistory(anns)}
                                onImageUpdate={(newImg) => updateStep(selectedStep.id, { image: newImg })}
                                activeTool={activeTool}
                                activeColor={activeColor}
                                activeStyle={activeStyle}
                             />
                        </div>

                        <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <IconFileText className="w-3 h-3" /> Mô tả
                                </label>
                                <button 
                                    onClick={handleAiDescription}
                                    disabled={isAiGenerating}
                                    className="btn btn-xs btn-outline border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 gap-1 rounded-full"
                                >
                                    <IconSparkles className="w-3 h-3" /> {isAiGenerating ? 'Đang viết...' : 'AI Viết lại'}
                                </button>
                            </div>
                            
                            <SimpleEditor 
                                value={selectedStep.description}
                                onChange={(val) => updateStep(selectedStep.id, { description: val })}
                                placeholder="Mô tả bước này một cách rõ ràng..."
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <IconCamera className="w-16 h-16 text-indigo-300" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-300">Sẵn sàng tạo chưa?</h1>
                    <p className="mt-2 font-medium text-slate-400">Chụp màn hình hoặc tải ảnh lên để bắt đầu.</p>
                </div>
            )}
        </div>
        
        <video 
            ref={captureVideoRef} 
            className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" 
            muted 
            playsInline 
        />
      </div>
    </div>
  );
}
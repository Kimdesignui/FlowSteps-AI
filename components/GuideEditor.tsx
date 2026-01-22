import React, { useState, useRef, useEffect } from 'react';
import { DocStep, ProjectMetadata, Annotation, Guide } from '../types';
import ImageEditor from './ImageEditor';
import { analyzeScreenshot, generateStepDescription } from '../services/geminiService';
import { IconPlus, IconTrash, IconDownload, IconCamera, IconWand, IconArrowUp, IconArrowDown, IconGlobe, IconType, IconSquare, IconCircle, IconCrop, IconFileCode, IconFileText, IconArrowRight, IconUndo, IconRedo, IconEye, IconX, IconList, IconRefresh, IconImage, IconSparkles, IconCopy, IconCheck, IconSave, IconHome, IconBold, IconItalic } from './Icons';

// Simple WYSIWYG Editor Component
const SimpleEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const exec = (command: string) => {
        document.execCommand(command, false);
        if (editorRef.current) {
            editorRef.current.focus();
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
                <button onClick={() => exec('bold')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 tooltip tooltip-bottom" data-tip="Bold">
                    <IconBold className="w-4 h-4" />
                </button>
                <button onClick={() => exec('italic')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 tooltip tooltip-bottom" data-tip="Italic">
                    <IconItalic className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button onClick={() => exec('insertUnorderedList')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 tooltip tooltip-bottom" data-tip="Bullet List">
                    <IconList className="w-4 h-4" />
                </button>
            </div>
            <div 
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="p-4 min-h-[120px] outline-none text-slate-600 leading-relaxed text-lg [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-2"
                style={{ whiteSpace: 'pre-wrap' }}
                data-placeholder={placeholder}
            />
        </div>
    )
}

// Helper component for Document Preview
const DocumentPreview = ({ 
    steps, 
    metadata, 
    onClose,
    onExportHTML,
    onExportDOCX,
    onCopy
}: { 
    steps: DocStep[], 
    metadata: ProjectMetadata, 
    onClose: () => void,
    onExportHTML: (includeTOC: boolean) => void,
    onExportDOCX: (includeTOC: boolean) => void,
    onCopy: (includeTOC: boolean) => Promise<boolean>
}) => {
    const [includeTOC, setIncludeTOC] = useState(true);
    const [isCopying, setIsCopying] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopyClick = async () => {
        setIsCopying(true);
        const success = await onCopy(includeTOC);
        setIsCopying(false);
        if (success) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-base-200/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
            {/* Preview Navbar */}
            <div className="navbar bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 shrink-0 h-16 shadow-sm z-20">
                <div className="flex-1 gap-4">
                     <h2 className="font-bold text-xl text-indigo-900 flex items-center gap-2">
                        <span className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-pink-500 rounded-full"></span>
                        Preview Mode
                     </h2>
                     <label className="label cursor-pointer gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors" title="Includes Table of Contents in the exported file">
                        <input 
                            type="checkbox" 
                            checked={includeTOC} 
                            onChange={(e) => setIncludeTOC(e.target.checked)} 
                            className="checkbox checkbox-xs checkbox-primary" 
                        />
                        <span className="label-text font-semibold text-indigo-700 text-xs uppercase tracking-wider flex items-center gap-1">Export TOC</span>
                     </label>
                </div>
                
                <div className="flex-none gap-3">
                    <button 
                        onClick={handleCopyClick} 
                        disabled={isCopying}
                        className={`btn btn-sm rounded-full gap-2 border-none shadow-lg transition-all ${
                            copySuccess 
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                            : 'bg-teal-500 text-white hover:bg-teal-600 hover:shadow-teal-500/30'
                        }`}
                    >
                        {copySuccess ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                        {copySuccess ? 'Copied!' : 'Copy to Docs'}
                    </button>

                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    <button onClick={() => onExportHTML(includeTOC)} className="btn btn-outline btn-primary btn-sm rounded-full gap-2 hover:shadow-glow">
                        <IconFileCode className="w-4 h-4" /> HTML
                    </button>
                    <button onClick={() => onExportDOCX(includeTOC)} className="btn btn-primary btn-sm rounded-full gap-2 text-white shadow-lg hover:shadow-indigo-500/30 border-none gradient-bg">
                        <IconFileText className="w-4 h-4" /> DOCX
                    </button>
                    <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                        <IconX className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Preview Body with Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* TOC Sidebar */}
                <div className="w-80 bg-white border-r border-indigo-50 h-full overflow-y-auto p-6 hidden lg:block shrink-0 custom-scrollbar">
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                        <IconList className="w-4 h-4" /> Table of Contents
                    </h3>
                    <ul className="space-y-2 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-indigo-50 -z-10"></div>
                        
                        {steps.map((step, idx) => (
                            <li key={step.id}>
                                <a href={`#step-${step.id}`} className="flex items-start gap-3 group p-2 rounded-xl hover:bg-indigo-50 transition-all">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all z-10">
                                        {idx + 1}
                                    </span>
                                    <div className="pt-1">
                                        <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-900 block leading-tight mb-1">{step.title}</span>
                                        <span className="text-[10px] text-slate-400 block line-clamp-1">
                                            {/* Strip HTML tags for TOC preview */}
                                            {step.description.replace(/<[^>]+>/g, '').substring(0, 40)}...
                                        </span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-50/50 scroll-smooth">
                    <div className="w-[850px] bg-white shadow-xl p-16 min-h-screen rounded-3xl border border-white mb-20">
                        <h1 className="text-5xl font-extrabold text-slate-900 border-b-2 border-indigo-100 pb-8 mb-6 tracking-tight">{metadata.title}</h1>
                        <div className="flex justify-between text-slate-500 font-medium mb-12 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-400"></span> Author: {metadata.author}</span>
                            <span>{metadata.date}</span>
                        </div>
                        
                        {steps.map((step, idx) => (
                            <div key={step.id} id={`step-${step.id}`} className="mb-20 break-inside-avoid scroll-mt-24">
                                <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-4">
                                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 text-lg font-bold">{idx + 1}</span>
                                    {step.title}
                                </h2>
                                <div className="relative inline-block mb-8 border-4 border-slate-100 rounded-xl overflow-hidden shadow-lg max-w-full group hover:border-indigo-100 transition-colors">
                                    <img src={step.image} alt="step" className="max-w-full h-auto block" />
                                    {step.annotations.map(ann => {
                                        if (ann.type === 'arrow') {
                                            const angle = Math.atan2((ann.height || 0) - ann.y, (ann.width || 0) - ann.x) * 180 / Math.PI;
                                            const length = Math.sqrt(Math.pow((ann.width || 0) - ann.x, 2) + Math.pow((ann.height || 0) - ann.y, 2));
                                            return (
                                                <div key={ann.id} style={{
                                                    position: 'absolute', left: `${ann.x}%`, top: `${ann.y}%`,
                                                    width: `${length}%`, height: '4px', backgroundColor: ann.color || 'red',
                                                    transformOrigin: '0 50%', transform: `rotate(${angle}deg)`
                                                }}>
                                                    <div style={{
                                                        position: 'absolute', right: '-4px', top: '-6px',
                                                        width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
                                                        borderLeft: `12px solid ${ann.color || 'red'}`
                                                    }} />
                                                </div>
                                            )
                                        }
                                        if (ann.type === 'number') {
                                            return <div key={ann.id} className="absolute flex items-center justify-center font-bold text-white rounded-full border-2 border-white shadow-lg text-xs" 
                                                style={{ left: `${ann.x}%`, top: `${ann.y}%`, width: '28px', height: '28px', backgroundColor: ann.color, transform: 'translate(-50%, -50%)' }}>{ann.text}</div>
                                        }
                                        if (ann.type === 'rect' || ann.type === 'circle') {
                                            const radius = ann.type === 'circle' ? '50%' : '8px';
                                            return <div key={ann.id} className="absolute" style={{
                                                left: `${ann.x}%`, top: `${ann.y}%`, width: `${ann.width}%`, height: `${ann.height}%`,
                                                borderRadius: radius, borderColor: ann.color, borderWidth: ann.style === 'outline' ? '4px' : '0', borderStyle: 'solid',
                                                backgroundColor: ann.style === 'fill' ? ann.color : 'transparent', opacity: ann.style === 'fill' ? 0.3 : 1,
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }} />
                                        }
                                        if (ann.type === 'text') {
                                            return <div key={ann.id} className="absolute font-bold text-xl" style={{
                                                left: `${ann.x}%`, top: `${ann.y}%`, color: ann.color, transform: 'translate(-50%, -50%)',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                            }}>{ann.text}</div>
                                        }
                                        return null;
                                    })}
                                </div>
                                <div className="bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6 shadow-sm">
                                    <div 
                                        className="prose prose-slate max-w-none text-lg leading-relaxed text-slate-700 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-2" 
                                        dangerouslySetInnerHTML={{ __html: step.description }} 
                                    />
                                </div>
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
    onRecordRequest: () => void;
}

export default function GuideEditor({ initialGuide, onSave, onBack, onRecordRequest }: GuideEditorProps) {
  const [steps, setSteps] = useState<DocStep[]>(initialGuide?.steps || []);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(initialGuide?.steps[0]?.id || null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  const [history, setHistory] = useState<{ past: Annotation[][], future: Annotation[][] }>({ past: [], future: [] });

  const [activeTool, setActiveTool] = useState<'number' | 'text' | 'rect' | 'circle' | 'crop' | 'arrow'>('number');
  const [activeColor, setActiveColor] = useState('#6366f1'); // Default Indigo
  const [activeStyle, setActiveStyle] = useState<'outline' | 'fill'>('outline');

  const [metadata, setMetadata] = useState<ProjectMetadata>(initialGuide?.metadata || {
    title: 'New Guide',
    author: 'Author',
    date: new Date().toLocaleDateString(),
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null); 

  useEffect(() => {
    setHistory({ past: [], future: [] });
  }, [selectedStepId]);

  const handleManualSave = () => {
      setSaveStatus('saving');
      const guideToSave: Guide = {
          id: initialGuide?.id || Date.now().toString(),
          metadata,
          steps,
          lastModified: Date.now()
      };
      onSave(guideToSave);
      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any
      });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      track.stop();

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        addStep(canvas.toDataURL('image/png'));
      }
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
        const track = stream.getVideoTracks()[0];
        const imageCapture = new (window as any).ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        track.stop();

        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            updateStep(selectedStepId, { image: canvas.toDataURL('image/png') });
        }
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
      title: 'Processing...',
      description: 'Analyzing...',
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
            s.id === id ? { ...s, title: 'Step Captured', description: 'Analysis failed.', isProcessing: false } : s
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

  // --- Export Logic ---
  const generateHTMLContent = (includeTOC: boolean) => {
    // Styling injected into the exported HTML for consistency
    const font = "font-family: 'Segoe UI', Inter, sans-serif;";
    let html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { ${font} max-width: 850px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #f8fafc; }
          .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
          h1 { color: #312e81; border-bottom: 2px solid #e0e7ff; padding-bottom: 20px; margin-bottom: 30px; font-weight: 800; font-size: 36px; }
          .meta { color: #64748b; margin-bottom: 40px; font-style: italic; background: #f1f5f9; padding: 15px; border-radius: 10px; }
          .toc { background: #e0e7ff; padding: 25px; border-radius: 15px; margin-bottom: 50px; }
          .toc h3 { margin-top: 0; color: #312e81; font-weight: 700; }
          .toc ul { list-style: none; padding: 0; }
          .toc li { margin-bottom: 10px; border-bottom: 1px solid #c7d2fe; padding-bottom: 5px; }
          .toc a { text-decoration: none; color: #4338ca; font-weight: 600; font-size: 16px; }
          .step { margin-bottom: 60px; page-break-inside: avoid; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: white; }
          .step-title { font-size: 24px; font-weight: 800; margin-bottom: 20px; color: #1e293b; display: flex; align-items: center; gap: 12px; }
          .step-num { background: #4f46e5; color: white; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; box-shadow: 0 2px 5px rgba(79, 70, 229, 0.4); }
          .step-img-container { position: relative; display: inline-block; margin-bottom: 25px; max-width: 100%; border-radius: 8px; overflow: hidden; border: 2px solid #f1f5f9; }
          .step-img { max-width: 100%; display: block; height: auto; }
          .badge { position: absolute; background: #ec4899; color: white; border-radius: 50%; width: 28px; height: 28px; text-align: center; line-height: 28px; font-weight: bold; border: 2px solid white; transform: translate(-50%, -50%); font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
          .desc { font-size: 18px; color: #334155; background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 5px solid #6366f1; }
          .desc ul { list-style-type: disc; padding-left: 20px; margin: 10px 0; }
          .desc b, .desc strong { font-weight: bold; color: #1e293b; }
          .desc i, .desc em { font-style: italic; }
        </style>
      </head>
      <body>
      <div class="container">
        <h1>${metadata.title}</h1>
        <div class="meta">Created by ${metadata.author} on ${metadata.date}</div>
    `;

    if (includeTOC) {
        html += `<div class="toc"><h3>Table of Contents</h3><ul>`;
        steps.forEach((step, idx) => {
            html += `<li><a href="#step-${step.id}">${idx + 1}. ${step.title}</a></li>`;
        });
        html += `</ul></div>`;
    }

    steps.forEach((step, idx) => {
        html += `
        <div class="step" id="step-${step.id}">
            <div class="step-title"><span class="step-num">${idx + 1}</span> ${step.title}</div>
            <div class="step-img-container">
                <img src="${step.image}" class="step-img" />
                ${step.annotations.map(ann => {
                    if (ann.type === 'number') {
                        return `<div class="badge" style="left:${ann.x}%; top:${ann.y}%; background-color:${ann.color};">${ann.text}</div>`;
                    }
                    if (ann.type === 'rect' || ann.type === 'circle') {
                        const style = ann.style === 'fill' ? `background-color:${ann.color};opacity:0.3;border:none;` : `border-color:${ann.color};`;
                        const radius = ann.type === 'circle' ? '50%' : '6px';
                        return `<div style="position:absolute; left:${ann.x}%; top:${ann.y}%; width:${ann.width}%; height:${ann.height}%; border:4px solid ${ann.color}; border-radius:${radius}; ${style} box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`;
                    }
                    if (ann.type === 'arrow') {
                         const angle = Math.atan2((ann.height || 0) - ann.y, (ann.width || 0) - ann.x) * 180 / Math.PI;
                         const length = Math.sqrt(Math.pow((ann.width || 0) - ann.x, 2) + Math.pow((ann.height || 0) - ann.y, 2));
                         return `<div style="position:absolute; left:${ann.x}%; top:${ann.y}%; width:${length}%; height:4px; background-color:${ann.color}; transform-origin:0 50%; transform:rotate(${angle}deg); box-shadow: 0 1px 2px rgba(0,0,0,0.3);"><div style="position:absolute; right:-4px; top:-6px; width:0; height:0; border-top:8px solid transparent; border-bottom:8px solid transparent; border-left:12px solid ${ann.color};"></div></div>`;
                    }
                    if (ann.type === 'text') {
                         return `<div style="position:absolute; left:${ann.x}%; top:${ann.y}%; transform:translate(-50%, -50%); color:${ann.color}; font-weight:bold; font-size:18px; text-shadow: 0 1px 3px rgba(0,0,0,0.4); font-family: sans-serif;">${ann.text}</div>`;
                    }
                    return '';
                }).join('')}
            </div>
            <div class="desc">${step.description}</div>
        </div>
        `;
    });

    html += `</div></body></html>`;
    return html;
  };

  const handleExportHTML = (includeTOC: boolean) => {
    const content = generateHTMLContent(includeTOC);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportDOCX = (includeTOC: boolean) => {
    // Basic HTML-as-Word export
    const content = generateHTMLContent(includeTOC);
    const blob = new Blob(['\ufeff', content], {
        type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (includeTOC: boolean): Promise<boolean> => {
      try {
          const content = generateHTMLContent(includeTOC);
          const blobHtml = new Blob([content], { type: 'text/html' });
          const blobText = new Blob([content], { type: 'text/plain' });
          
          const item = new ClipboardItem({ 
              'text/html': blobHtml,
              'text/plain': blobText 
          });
          await navigator.clipboard.write([item]);
          return true;
      } catch (err) {
          console.error("Copy failed", err);
          return false;
      }
  };

  const selectedStep = steps.find(s => s.id === selectedStepId);

  return (
    <div className="flex h-screen w-full bg-base-200 font-sans text-slate-800">
      
      {/* Document Preview Overlay */}
      {isPreviewMode && (
          <DocumentPreview 
            steps={steps} 
            metadata={metadata} 
            onClose={() => setIsPreviewMode(false)} 
            onExportHTML={handleExportHTML}
            onExportDOCX={handleExportDOCX}
            onCopy={handleCopy}
          />
      )}

      {/* Sidebar - Floating Colorful Card Style */}
      <div className="w-80 flex flex-col z-20 h-full p-4 pr-0">
         <div className="bg-white rounded-3xl shadow-soft h-full flex flex-col overflow-hidden border border-white/50">
            <div className="p-6 border-b border-indigo-50 bg-gradient-to-r from-white to-indigo-50/30">
                 <button onClick={onBack} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 mb-2 flex items-center gap-1">
                     <IconHome className="w-3 h-3" /> Dashboard
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
                      className={`relative p-4 rounded-2xl transition-all cursor-pointer group border ${
                        selectedStepId === step.id 
                        ? 'border-indigo-200 bg-indigo-50 shadow-md scale-[1.02]' 
                        : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-100'
                      }`}
                    >
                        <div className="flex gap-3 items-start">
                             <div className={`w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold ${selectedStepId === step.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
                                {index + 1}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-sm truncate ${selectedStepId === step.id ? 'text-indigo-900' : 'text-slate-700'}`}>{step.title}</h3>
                                <p className="text-xs opacity-60 truncate mt-0.5">{step.isProcessing ? '✨ Analyzing...' : step.description.replace(/<[^>]+>/g, '')}</p>
                             </div>
                        </div>
                         
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white rounded-full shadow-sm border border-slate-100 p-0.5 scale-90">
                             <button onClick={(e) => { e.stopPropagation(); moveStep(index, 'up'); }} className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"><IconArrowUp className="w-3 h-3" /></button>
                             <button onClick={(e) => { e.stopPropagation(); moveStep(index, 'down'); }} className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"><IconArrowDown className="w-3 h-3" /></button>
                             <button onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }} className="p-1 hover:text-red-500 hover:bg-red-50 rounded-full"><IconTrash className="w-3 h-3" /></button>
                         </div>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                      <button onClick={handleCapture} className="py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-2 group">
                            <IconCamera className="w-5 h-5" />
                            <span className="text-xs font-bold">Snap</span>
                      </button>
                      <button onClick={onRecordRequest} className="py-4 border-2 border-dashed border-pink-200 rounded-2xl text-pink-400 hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50/50 transition-all flex flex-col items-center justify-center gap-2 group">
                            <IconGlobe className="w-5 h-5" />
                            <span className="text-xs font-bold">Record</span>
                      </button>
                  </div>
            </div>

            <div className="p-4 border-t border-indigo-50 bg-slate-50/50">
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-block bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 rounded-xl shadow-sm gap-2 normal-case font-semibold">
                    <IconPlus className="w-4 h-4"/> Upload Image
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Navbar */}
        <div className="h-20 flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex-1">
            <input 
                value={metadata.title}
                onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                className="input input-ghost text-2xl font-black text-slate-800 w-full max-w-lg px-0 hover:bg-transparent focus:bg-transparent placeholder:text-slate-300"
                placeholder="Name your guide..."
            />
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-full shadow-soft border border-indigo-50">
             {/* Tool Bar */}
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
                    {activeStyle === 'fill' ? 'Fill' : 'Ln'}
                </button>
             </div>

             <div className="flex gap-1 px-2 border-r border-slate-100 mr-2">
                 <button onClick={handleUndo} disabled={history.past.length === 0} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"><IconUndo className="w-4 h-4" /></button>
                 <button onClick={handleRedo} disabled={history.future.length === 0} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"><IconRedo className="w-4 h-4" /></button>
             </div>

             <button onClick={handleManualSave} className={`btn btn-sm btn-ghost gap-2 rounded-full ${saveStatus === 'saved' ? 'text-green-600' : 'text-slate-600'}`}>
                 {saveStatus === 'saved' ? <IconCheck className="w-4 h-4" /> : <IconSave className="w-4 h-4" />}
                 {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
             </button>

             <button onClick={() => setIsPreviewMode(true)} className="btn btn-primary rounded-full px-6 shadow-glow border-none gradient-bg text-white ml-2">
                <IconEye className="w-4 h-4" /> Preview
             </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
            {selectedStep ? (
                <div className="card w-full max-w-5xl bg-white shadow-xl rounded-[2rem] min-h-[800px] transition-all border border-white/60 mb-20">
                    <div className="card-body p-10">
                        <div className="flex flex-col gap-2 mb-8">
                            <div className="flex justify-between items-center pb-2">
                                <span className="badge badge-lg bg-indigo-50 text-indigo-700 border-none font-bold uppercase tracking-widest text-xs py-3 px-4">Step {steps.findIndex(s => s.id === selectedStep.id) + 1}</span>
                                <button 
                                    onClick={async () => {
                                        updateStep(selectedStep.id, { isProcessing: true });
                                        const res = await analyzeScreenshot(selectedStep.image);
                                        updateStep(selectedStep.id, { title: res.title, description: res.description, isProcessing: false });
                                    }}
                                    className="btn btn-ghost btn-sm text-indigo-600 gap-2 hover:bg-indigo-50 rounded-full font-semibold"
                                >
                                    <IconWand className="w-4 h-4" /> AI Auto-Analyze
                                </button>
                            </div>
                            <input 
                                value={selectedStep.title}
                                onChange={(e) => updateStep(selectedStep.id, { title: e.target.value })}
                                className="input input-ghost text-4xl font-black w-full px-0 focus:bg-transparent text-slate-800 placeholder:text-slate-200"
                                placeholder="What is this step?"
                            />
                        </div>

                        {/* Moved Buttons Outside */}
                        <div className="flex justify-end gap-2 mb-2">
                             <input type="file" ref={replaceFileInputRef} className="hidden" accept="image/*" onChange={handleReplaceUpload} />
                             <button onClick={() => replaceFileInputRef.current?.click()} className="btn btn-sm bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-sm gap-2 rounded-full">
                                <IconImage className="w-4 h-4" /> Replace Image
                             </button>
                             <button onClick={handleReplaceCapture} className="btn btn-sm bg-white border border-slate-200 text-indigo-600 hover:border-indigo-300 shadow-sm gap-2 rounded-full">
                                <IconRefresh className="w-4 h-4" /> Retake
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
                                    <IconFileText className="w-3 h-3" /> Description
                                </label>
                                <button 
                                    onClick={handleAiDescription}
                                    disabled={isAiGenerating}
                                    className="btn btn-xs btn-outline border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 gap-1 rounded-full"
                                >
                                    <IconSparkles className="w-3 h-3" /> {isAiGenerating ? 'Writing...' : 'AI Enhance'}
                                </button>
                            </div>
                            
                            <SimpleEditor 
                                value={selectedStep.description}
                                onChange={(val) => updateStep(selectedStep.id, { description: val })}
                                placeholder="Explain this step clearly..."
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <IconCamera className="w-16 h-16 text-indigo-300" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-300">Ready to Create?</h1>
                    <p className="mt-2 font-medium text-slate-400">Snap a screenshot or upload an image to begin.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
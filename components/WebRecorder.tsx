import React, { useState, useRef, useEffect } from 'react';
import { IconGlobe, IconCamera, IconStop, IconExternalLink, IconWand } from './Icons';

interface WebRecorderProps {
  onFinish: (capturedImages: string[]) => void;
  onCancel: () => void;
}

const WebRecorder: React.FC<WebRecorderProps> = ({ onFinish, onCancel }) => {
  const [url, setUrl] = useState('');
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [remoteOpen, setRemoteOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageCaptureRef = useRef<any>(null); 
  const remoteWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    // Listen for messages from the remote control popup
    const handleMessage = (event: MessageEvent) => {
        if (event.data === 'SNAP_TRIGGER') {
            captureStep();
        }
    };
    window.addEventListener('message', handleMessage);
    return () => {
        window.removeEventListener('message', handleMessage);
        // Close popup when component unmounts
        if (remoteWindowRef.current) remoteWindowRef.current.close();
    };
  }, []);

  const handleGo = () => {
    let target = url;
    if (!target.startsWith('http')) {
      target = 'https://' + target;
    }
    setActiveUrl(target);
  };

  const openInNewTab = () => {
    if (activeUrl) {
        window.open(activeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const openRemoteControl = () => {
    const width = 220;
    const height = 160;
    // Position it at the bottom right by default
    const left = window.screen.width - width - 20;
    const top = window.screen.height - height - 100;
    
    // Check if already open
    if (remoteWindowRef.current && !remoteWindowRef.current.closed) {
        remoteWindowRef.current.focus();
        setRemoteOpen(true);
        return;
    }

    const popup = window.open('', 'FlowStepsRemote', `width=${width},height=${height},left=${left},top=${top}`);
    
    if (popup) {
        remoteWindowRef.current = popup;
        setRemoteOpen(true);
        
        popup.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>FlowSteps Control</title>
                <style>
                    body { margin: 0; background-color: #1e293b; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; overflow: hidden; border: 4px solid #3b82f6; box-sizing: border-box; }
                    button { 
                        width: 80px; height: 80px; border-radius: 50%; background-color: #ef4444; 
                        border: 4px solid white; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); 
                        transition: transform 0.1s; display: flex; align-items: center; justify-content: center;
                        outline: none;
                    }
                    button:active { transform: scale(0.95); background-color: #dc2626; }
                    button:hover { background-color: #f87171; }
                    .label { color: white; font-weight: bold; margin-top: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                    .sub { color: #94a3b8; font-size: 11px; text-align: center; margin-top: 4px; padding: 0 10px; line-height: 1.2; }
                </style>
            </head>
            <body>
                <button onclick="window.opener.postMessage('SNAP_TRIGGER', '*')"></button>
                <div class="label">SNAP</div>
                <div class="sub">Keep visible. <br>Do not use Fullscreen.</div>
            </body>
            </html>
        `);
    } else {
        alert("Popups blocked! Please allow popups for this site to see the Control Button.");
    }
  };

  const startRecording = async () => {
    try {
      // Ensure remote is open before starting if possible, or at least try
      if (!remoteWindowRef.current || remoteWindowRef.current.closed) {
         openRemoteControl();
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any,
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      imageCaptureRef.current = new (window as any).ImageCapture(track);
      
      setIsRecording(true);
      
      track.onended = () => {
        handleFinish();
      };

    } catch (err) {
      console.error("Failed to start recording:", err);
      // More friendly error message based on the issue
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
          alert("Permission denied. Please allow screen recording permission when prompted.");
      } else {
          alert("Could not start screen capture. Error: " + (err as Error).message);
      }
    }
  };

  const captureStep = async () => {
    if (!imageCaptureRef.current) return;

    try {
        // Visual feedback on the internal button too
        const btn = document.getElementById('capture-btn');
        if(btn) {
            btn.classList.add('scale-95', 'ring-4', 'ring-brand-200');
            setTimeout(() => btn.classList.remove('scale-95', 'ring-4', 'ring-brand-200'), 150);
        }

        const bitmap = await imageCaptureRef.current.grabFrame();
        
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            const base64 = canvas.toDataURL('image/png');
            setCapturedImages(prev => [...prev, base64]);
            setCapturedCount(prev => prev + 1);
        }
    } catch (err) {
        console.error("Frame capture failed", err);
    }
  };

  const handleFinish = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (remoteWindowRef.current) {
        remoteWindowRef.current.close();
    }
    onFinish(capturedImages);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 text-sm font-medium">
            ← Back
          </button>
          
          <div className="flex items-center gap-2 flex-1 max-w-xl bg-slate-50 border border-slate-200 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
            <IconGlobe className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGo()}
              placeholder="Enter website URL (e.g., google.com)"
              className="bg-transparent border-none focus:ring-0 w-full text-sm text-slate-700 placeholder-slate-400"
              disabled={isRecording}
            />
          </div>
          <button 
            onClick={handleGo}
            disabled={isRecording || !url}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50"
          >
            Load
          </button>
          
          {activeUrl && (
             <button
                onClick={openInNewTab}
                className="flex items-center gap-2 px-3 py-2 text-brand-600 hover:bg-brand-50 rounded-md text-sm font-medium transition-colors border border-brand-200"
                title="Open in new window"
             >
                <IconExternalLink className="w-4 h-4" />
                Open External
             </button>
          )}
        </div>

        <div className="flex items-center gap-4 ml-4">
           {/* Launch Remote Button - Always visible now */}
           <button 
                onClick={openRemoteControl} 
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold border transition-colors ${
                    remoteOpen 
                    ? 'bg-green-100 text-green-700 border-green-300' 
                    : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                }`}
           >
                <IconWand className="w-4 h-4" />
                {remoteOpen ? 'Remote Active' : 'Launch Remote'}
           </button>

           {!isRecording ? (
             <button 
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 shadow-sm animate-pulse font-medium"
             >
                <div className="w-2 h-2 rounded-full bg-white" />
                Start Session
             </button>
           ) : (
             <div className="flex items-center gap-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Steps: <span className="text-brand-600 text-lg">{capturedCount}</span>
                </div>
                <button 
                    onClick={handleFinish}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm font-medium"
                >
                    <IconStop className="w-4 h-4" />
                    Finish
                </button>
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Main View Area */}
        <div className="flex-1 bg-slate-200 relative flex items-center justify-center">
            {activeUrl ? (
                <div className="w-full h-full relative flex flex-col">
                     {/* Guidance Banner */}
                    <div className="bg-blue-50 text-blue-900 text-sm px-6 py-4 flex flex-col gap-2 border-b border-blue-200 shadow-sm relative z-10">
                        <div className="font-bold flex items-center gap-2">
                            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">i</span>
                            How to capture from an external window:
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-700 ml-1">
                            <li>Click <span className="font-semibold text-brand-600">Open External</span> to launch your website in a new window.</li>
                            <li>Click <span className="font-semibold text-blue-700">Launch Remote</span> above to open the red capture button.</li>
                            <li>Click <span className="font-semibold text-brand-600">Start Session</span> and select the external window to share.</li>
                            <li className="text-red-600 font-bold">Important: Do not use Fullscreen mode on the target site (the button will disappear).</li>
                            <li>Use the <span className="font-bold text-red-600">Red Remote Button</span> to snap each step.</li>
                        </ol>
                    </div>
                    
                    <iframe 
                        src={activeUrl} 
                        className="w-full flex-1 bg-white"
                        title="Web View"
                    />
                </div>
            ) : (
                <div className="text-center text-slate-400 max-w-md mx-auto">
                    <IconGlobe className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">Web Guide Recorder</h3>
                    <p className="text-sm">Enter a URL above to verify the site.</p>
                    <p className="text-sm mt-2">For best results with complex sites, open them in a new window and use our <b>Remote Control</b> feature.</p>
                </div>
            )}
        </div>

        {/* Internal Sidebar Controls (Still available if user stays in tab) */}
        {isRecording && (
            <div className="w-24 bg-slate-900 flex flex-col items-center py-6 gap-6 z-30 shadow-xl border-l border-slate-700">
                <div className="flex flex-col items-center gap-2 sticky top-6">
                    <button
                        id="capture-btn"
                        onClick={captureStep}
                        className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center shadow-lg transition-all active:scale-95 group"
                        title="Capture Step"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-red-500 group-hover:bg-red-600" />
                    </button>
                    <span className="text-white text-xs font-bold uppercase tracking-widest mt-1">Snap</span>
                </div>
                
                {/* Hidden video element for stream capture */}
                <video ref={videoRef} className="w-16 h-auto opacity-50 rounded border border-slate-700 hidden" muted playsInline />
            </div>
        )}
      </div>
    </div>
  );
};

export default WebRecorder;
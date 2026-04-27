import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { FileText, X, ArrowUp, ArrowDown, Download, Loader2, Settings2, HelpCircle } from 'lucide-react';
import './App.css';

interface FileWithId {
  id: string;
  file: File;
  range: string;
}

function App() {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        range: '' // Default to all pages
      }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateRange = (id: string, range: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, range } : f));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
      setFiles(newFiles);
    }
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setIsMerging(true);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f.file));
    formData.append('ranges', JSON.stringify(files.map(f => f.range)));

    try {
      const response = await axios.post('http://localhost:3001/merge', formData, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Make sure the backend server is running.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="container">
      <header className="hero">
        <div className="logo-badge">PDF</div>
        <h1>Merge Master</h1>
        <p>A professional tool to combine and customize your PDF documents.</p>
      </header>

      <main>
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''}`} 
          onClick={open}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <div className="icon-stack">
              <FileText size={40} className="icon-main" />
              <div className="icon-plus">+</div>
            </div>
            {isDragActive ? (
              <h3>Drop your files here</h3>
            ) : (
              <>
                <h3>Drag & drop PDFs</h3>
                <p>or click to browse from your computer</p>
              </>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <div className="workspace">
            <div className="workspace-header">
              <h2>Your Selection ({files.length})</h2>
              <div className="hint">
                <HelpCircle size={14} />
                <span>Drag or use arrows to reorder. Leave range empty for all pages.</span>
              </div>
            </div>

            <div className="file-grid">
              {files.map((f, index) => (
                <div key={f.id} className="file-card">
                  <div className="card-top">
                    <div className="file-preview">
                      <FileText size={24} />
                    </div>
                    <div className="file-meta">
                      <span className="file-name" title={f.file.name}>{f.file.name}</span>
                      <span className="file-size">{(f.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} 
                      className="close-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="card-config">
                    <div className="input-group">
                      <label>
                        <Settings2 size={14} />
                        Page Range
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1-3, 5, 8-10" 
                        value={f.range}
                        onChange={(e) => updateRange(f.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <div className="card-actions">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveFile(index, 'up'); }} 
                      disabled={index === 0}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveFile(index, 'down'); }} 
                      disabled={index === files.length - 1}
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="action-footer">
              <button 
                className="merge-btn-large" 
                onClick={(e) => { e.stopPropagation(); mergePdfs(); }} 
                disabled={files.length < 2 || isMerging}
              >
                {isMerging ? (
                  <>
                    <Loader2 className="spinner" size={24} />
                    Processing Documents...
                  </>
                ) : (
                  <>
                    <Download size={24} />
                    Merge and Download
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>Built with pdf-lib & React • Securely processed in-memory</p>
      </footer>
    </div>
  );
}

export default App;

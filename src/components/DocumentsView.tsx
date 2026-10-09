import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Sparkles,
  BookOpen,
  MessageSquare,
  HelpCircle,
  FileCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Layers,
  FileCode,
  X,
  AlertCircle,
} from 'lucide-react';
import { DocumentItem } from '../types/index.js';
import { MarkdownRenderer } from './MarkdownRenderer.js';
import { api } from '../services/api.js';

interface DocumentsViewProps {
  documents: DocumentItem[];
  onUploadSuccess: (newDoc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  onStartChatWithDocument: (docId: string, docTitle: string) => void;
  onStartQuizFromDocument: (docId: string, docTitle: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onUploadSuccess,
  onDeleteDocument,
  onStartChatWithDocument,
  onStartQuizFromDocument,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [activeActionModal, setActiveActionModal] = useState<{
    action: string;
    title: string;
    result: string | null;
    isLoading: boolean;
  } | null>(null);

  const [searchDoc, setSearchDoc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploadError(null);

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds 15MB limit. Please upload a smaller document.');
      return;
    }

    // Validate file type: PDF, TXT, MD, JSON
    const validExtensions = ['.pdf', '.txt', '.md', '.markdown', '.json'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setUploadError('Unsupported file type. Please upload a PDF, TXT, or Markdown document.');
      return;
    }

    setIsUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      onUploadSuccess(doc);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process document upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRunAction = async (doc: DocumentItem, action: any, title: string) => {
    setActiveActionModal({ action, title, result: null, isLoading: true });
    try {
      const res = await api.runDocumentAction(doc.id, action);
      setActiveActionModal({ action, title, result: res.result, isLoading: false });
    } catch (err: any) {
      setActiveActionModal({ action, title, result: `Failed to execute: ${err.message}`, isLoading: false });
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(searchDoc.toLowerCase()) ||
    d.filename.toLowerCase().includes(searchDoc.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-sky-50/20 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 mb-2">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Retrieval-Augmented Generation (RAG)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Study Materials Library
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Upload textbook chapters, research papers, and lecture notes. StudySphere indexes your material into semantic chunks for grounded Q&A and exam prep.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm self-start sm:self-auto shadow-sky-500/20"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.markdown,.json"
            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
        </div>

        {/* Drag and Drop Upload Zone */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30'
              : 'border-sky-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-400'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Upload className={`w-6 h-6 ${isUploading ? 'animate-bounce' : ''}`} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isUploading ? 'Extracting text and generating vector chunks...' : 'Drag & drop study files here, or browse'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supports PDF, TXT, and Markdown files up to 15MB.
          </p>

          {uploadError && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Documents List & Search */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Your Indexed Documents ({documents.length})
            </h3>
            {documents.length > 2 && (
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter materials..."
                  value={searchDoc}
                  onChange={e => setSearchDoc(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {filteredDocs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No study materials uploaded yet
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your lecture slides or textbooks to start grounding AI explanations with citations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-600 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {doc.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {doc.filename} • {Math.round(doc.fileSize / 1024)} KB
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Remove "${doc.title}" from your study materials?`)) {
                            onDeleteDocument(doc.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {doc.summary && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-sky-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-sky-100 dark:border-slate-800/80 mb-3 line-clamp-2">
                        {doc.summary}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-4">
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold">
                        {doc.chunkCount} RAG Chunks
                      </span>
                      <span>Added {new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRunAction(doc, 'summarize', `Chapter Summary: ${doc.title}`)}
                        className="text-[11px] px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-800 dark:text-slate-300 font-medium transition"
                      >
                        Summary
                      </button>
                      <button
                        onClick={() => handleRunAction(doc, 'definitions', `Glossary & Key Definitions: ${doc.title}`)}
                        className="text-[11px] px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-800 dark:text-slate-300 font-medium transition"
                      >
                        Glossary
                      </button>
                      <button
                        onClick={() => handleRunAction(doc, 'exam-questions', `High-Yield Exam Questions: ${doc.title}`)}
                        className="text-[11px] px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-800 dark:text-slate-300 font-medium transition"
                      >
                        Exam Qs
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onStartQuizFromDocument(doc.id, doc.title)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold hover:bg-sky-100 transition"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Quiz</span>
                      </button>

                      <button
                        onClick={() => onStartChatWithDocument(doc.id, doc.title)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition shadow-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for Quick Actions (Summaries, Glossary, Exam Questions) */}
        {activeActionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeActionModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                {activeActionModal.isLoading ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">
                      Analyzing material and synthesizing academic study aid...
                    </p>
                  </div>
                ) : (
                  <MarkdownRenderer content={activeActionModal.result || ''} />
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

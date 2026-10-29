// ====================================================================
// LearnMate AI - Study Materials & RAG Grounding Library
// Upload PDF, TXT, MD, inspect embeddings, ask grounded questions with
// section citations, and generate flashcards from uploaded notes.
// ====================================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Sparkles,
  Trash2,
  HelpCircle,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Send,
  ExternalLink,
} from 'lucide-react';
import { apiRequest, apiUpload } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { StudyDocument } from '../types';

export const StudyMaterialsPage: React.FC = () => {
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Document Q&A state
  const [activeDoc, setActiveDoc] = useState<StudyDocument | null>(null);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [qaCitations, setQaCitations] = useState<any[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  // Summary modal
  const [summaryDoc, setSummaryDoc] = useState<StudyDocument | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/documents');
      setDocuments(res.documents || []);
      if (res.documents?.length > 0 && !activeDoc) {
        setActiveDoc(res.documents[0]);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await apiUpload('/documents/upload', formData);
      setSelectedFile(null);
      await loadDocuments();
      if (res.document) {
        setActiveDoc(res.document);
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this study document and its vector embeddings?')) return;
    try {
      await apiRequest(`/documents/${docId}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (activeDoc?.id === docId) {
        setActiveDoc(null);
        setQaAnswer(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc || !qaQuestion.trim()) return;

    setIsAsking(true);
    setQaAnswer(null);
    setQaCitations([]);

    try {
      const res = await apiRequest(`/documents/${activeDoc.id}/ask`, {
        method: 'POST',
        body: JSON.stringify({ question: qaQuestion }),
      });

      setQaAnswer(res.answer);
      setQaCitations(res.citations || []);
    } catch (err: any) {
      setQaAnswer(`Failed to query document: ${err.message}`);
    } finally {
      setIsAsking(false);
    }
  };

  const handleSummarize = async (doc: StudyDocument) => {
    setSummaryDoc(doc);
    setIsSummarizing(true);
    setSummaryText(null);

    try {
      const res = await apiRequest(`/documents/${doc.id}/summarize`, { method: 'POST' });
      setSummaryText(res.summary);
    } catch (err: any) {
      setSummaryText('Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study Materials Library</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload PDF textbooks, lecture slides, or notes. Your AI Tutor grounds its answers directly in your materials.
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="p-6">
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Select or drop a file to index'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports PDF, TXT, or Markdown documents (Max 15MB)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.txt,.md"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Browse File
              </label>
              <Button
                type="submit"
                disabled={!selectedFile || isUploading}
                isLoading={isUploading}
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Upload & Embed
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Two Column Layout: Document List & Interactive Q&A Grounding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div>
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Your Uploaded Materials ({documents.length})
            </h3>

            <div className="space-y-2">
              {documents.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setActiveDoc(doc);
                      setQaAnswer(null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/70 text-brand-950 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className="text-xs truncate">{doc.filename}</span>
                      </div>
                      <button
                        onClick={(e) => handleDelete(doc.id, e)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{doc.chunk_count} chunks embedded</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSummarize(doc);
                        }}
                        className="text-brand-600 font-semibold hover:underline"
                      >
                        Summarize
                      </button>
                    </div>
                  </div>
                );
              })}

              {documents.length === 0 && !isLoading && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No documents uploaded yet.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Interactive Grounded Q&A Workspace */}
        <div className="lg:col-span-2">
          <Card className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <Badge variant="accent" size="sm">Document-Grounded Q&A</Badge>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {activeDoc ? `Querying: ${activeDoc.filename}` : 'Select a document to ask questions'}
                  </h3>
                </div>
                {activeDoc && (
                  <Link to={`/tutor?docId=${activeDoc.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs" rightIcon={<ExternalLink className="w-3 h-3" />}>
                      Open in Full Tutor
                    </Button>
                  </Link>
                )}
              </div>

              {/* Q&A Response Area */}
              <div className="min-h-[220px] bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-4">
                {qaAnswer ? (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block mb-1">
                        AI Tutor Grounded Explanation
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {qaAnswer}
                      </p>
                    </div>

                    {/* Citations Box */}
                    {qaCitations.length > 0 && (
                      <div className="pt-3 border-t border-slate-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700">Source Citations:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {qaCitations.map((c, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600">
                              <span className="font-semibold text-brand-700 block">
                                Section {c.chunkIndex + 1} {c.pageNumber ? `(Page ${c.pageNumber})` : ''}
                              </span>
                              <span className="italic text-slate-500 line-clamp-2 mt-0.5">"{c.snippet}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-medium">Ask any question about this document</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      The AI will retrieve matching passages and synthesize a referenced answer.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Question Input Form */}
            <form onSubmit={handleAskDocument} className="flex gap-2">
              <input
                type="text"
                placeholder={activeDoc ? `Ask a question about ${activeDoc.filename}...` : 'Select a document first'}
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                disabled={!activeDoc || isAsking}
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!activeDoc || !qaQuestion.trim() || isAsking}
                isLoading={isAsking}
                rightIcon={<Send className="w-3.5 h-3.5" />}
              >
                Ask Note
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Summary Modal */}
      <Modal
        isOpen={Boolean(summaryDoc)}
        onClose={() => setSummaryDoc(null)}
        title={summaryDoc ? `Summary: ${summaryDoc.filename}` : 'Document Summary'}
        description="Auto-generated conceptual synthesis of your uploaded notes"
      >
        {isSummarizing ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Synthesizing document takeaways...
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
            {summaryText}
          </div>
        )}
      </Modal>
    </div>
  );
};

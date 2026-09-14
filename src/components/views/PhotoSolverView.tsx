import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  BookMarked,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  RotateCw,
  Crop,
  Trash2,
  Copy,
  Volume2,
  VolumeX,
  Edit3,
  Layers,
  Languages,
  CheckCircle2,
  FileText,
  Sliders,
  HelpCircle,
  ArrowRight,
  Zap,
  X,
  Search,
  MessageSquare,
  Share2,
  History,
  ChevronRight,
  Filter,
  Clock,
  ArrowLeft,
  Lightbulb,
} from 'lucide-react';
import { StudentProfile, ExtractedQuestion, PhotoAnalysisResult, ScanHistoryItem } from '../../types';
import { AiService } from '../../services/aiService';
import { StorageService } from '../../services/storageService';
import { PrivacyService } from '../../services/privacyService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { MarkdownRenderer } from '../ai/MarkdownRenderer';
import {
  validateImageFile,
  validateImageFileDeep,
  rotateImageBase64,
  cropImageBase64,
  CropRect,
} from '../../utils/imageUtils';

interface PhotoSolverViewProps {
  profile: StudentProfile;
  onNavigate?: (viewId: string) => void;
  onNavigateToView?: (viewId: string) => void;
  lang?: string;
}

// Built-in sample problem images for instant testing
const SAMPLE_PROBLEMS = [
  {
    title: 'Class 10 Physics: Mirror Formula',
    subject: 'Science',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
    question: 'A concave mirror produces three times magnified real image of an object placed at 10 cm in front of it. Where is the image located?',
    hasDiagram: true,
    diagramDescription: 'Concave mirror ray diagram with focal point F and center of curvature C.',
    topic: 'Light - Reflection and Refraction',
  },
  {
    title: 'Class 10 Maths: Quadratic Equation',
    subject: 'Maths',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
    question: 'Solve the quadratic equation 2x² - 5x + 3 = 0 using the discriminant quadratic formula method.',
    hasDiagram: false,
    diagramDescription: null,
    topic: 'Quadratic Equations',
  },
  {
    title: 'Class 10 Hindi: दो प्रश्न (Multi-Question)',
    subject: 'Hindi',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    question: 'प्रश्न 1: "ऐसी बाणी बोलिए, मन का आपा खोइ" का भावार्थ स्पष्ट कीजिए।\nप्रश्न 2: कबीर के अनुसार मीठी वाणी बोलने से सुनने वाले और बोलने वाले पर क्या प्रभाव पड़ता है?',
    hasDiagram: false,
    diagramDescription: null,
    topic: 'स्पर्श - कबीर की साखी',
  },
  {
    title: 'Class 10 SST: Resource Classification',
    subject: 'SST',
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
    question: 'Differentiate between Renewable and Non-renewable resources with three examples of each.',
    hasDiagram: false,
    diagramDescription: null,
    topic: 'Resources and Development',
  },
];

const SUBJECT_OPTIONS = ['Maths', 'Science', 'English', 'Hindi', 'Sanskrit', 'SST', 'General'];

export const PhotoSolverView: React.FC<PhotoSolverViewProps> = ({
  profile,
  onNavigate,
  onNavigateToView,
}) => {
  const handleNavigate = (viewId: string) => {
    if (onNavigate) onNavigate(viewId);
    else if (onNavigateToView) onNavigateToView(viewId);
  };

  // Image & Camera States
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [rotation, setRotation] = useState<number>(0);

  // Interactive Cropping States
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 10, y: 10, width: 80, height: 80 });

  // WebRTC Live Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Analysis & OCR States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [editableQuestionText, setEditableQuestionText] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Science');
  const [hasDiagram, setHasDiagram] = useState<boolean>(false);
  const [diagramDescription, setDiagramDescription] = useState<string>('');
  const [isBlurryOrUnreadable, setIsBlurryOrUnreadable] = useState<boolean>(false);

  // Solver States
  const [isSolving, setIsSolving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>(
    profile.preferredLanguage === 'hi' ? 'hi' : 'en'
  );
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [solutionOutput, setSolutionOutput] = useState<string | null>(null);
  const [isSimplerMode, setIsSimplerMode] = useState<boolean>(false);

  // Scan History States
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>('All');

  // Feedback & Audio States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load history on mount
  useEffect(() => {
    loadScanHistory();
  }, []);

  // Keyboard accessibility for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isHistoryOpen) setIsHistoryOpen(false);
        if (isCameraOpen) stopCamera();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryOpen, isCameraOpen]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const loadScanHistory = () => {
    const items = StorageService.getScanHistory();
    setScanHistory(items);
  };

  // 1. File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = async (file: File) => {
    const check = await validateImageFileDeep(file);
    if (!check.valid) {
      showToast(check.error || 'Invalid image file.');
      return;
    }

    setMimeType(check.detectedMimeType || file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedImageBase64(base64);
      setOriginalImageBase64(base64);
      setRotation(0);
      setIsCropMode(false);
      resetAnalysisState();
      showToast('Image loaded & signature verified! Click "Scan & Detect Questions" to analyze.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  // 2. Camera Controls
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Live camera access error:', err);
      showToast('Camera permission denied or camera unavailable. Upload image file instead.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setSelectedImageBase64(dataUrl);
      setOriginalImageBase64(dataUrl);
      setMimeType('image/jpeg');
      setRotation(0);
      setIsCropMode(false);
      resetAnalysisState();
      stopCamera();
      showToast('Photo captured! Click "Scan & Detect Questions" to proceed.');
    }
  };

  // 3. Image Editing Controls (Rotate & Crop)
  const handleRotate = async () => {
    if (!selectedImageBase64) return;
    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);
    try {
      const rotated = await rotateImageBase64(selectedImageBase64, 90);
      setSelectedImageBase64(rotated);
      showToast('Image rotated 90°');
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyCrop = async () => {
    if (!selectedImageBase64) return;
    try {
      const cropped = await cropImageBase64(selectedImageBase64, cropRect);
      setSelectedImageBase64(cropped);
      setIsCropMode(false);
      showToast('Image cropped successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to crop image.');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageBase64(null);
    setOriginalImageBase64(null);
    resetAnalysisState();
  };

  const resetAnalysisState = () => {
    setAnalysisResult(null);
    setEditableQuestionText('');
    setSolutionOutput(null);
    setSelectedQuestionIndex(0);
    setHasDiagram(false);
    setDiagramDescription('');
    setIsBlurryOrUnreadable(false);
    setIsSimplerMode(false);
  };

  // 4. Reset & Scan Another Question
  const handleScanAnotherQuestion = () => {
    setSelectedImageBase64(null);
    setOriginalImageBase64(null);
    resetAnalysisState();
    showToast('Ready for your next homework question!');
  };

  // 5. Sample Problem Selection
  const handleSelectSample = (sample: typeof SAMPLE_PROBLEMS[0]) => {
    setSelectedImageBase64(sample.imageUrl);
    setOriginalImageBase64(sample.imageUrl);
    setSelectedSubject(sample.subject);
    setEditableQuestionText(sample.question);
    setHasDiagram(sample.hasDiagram);
    setDiagramDescription(sample.diagramDescription || '');
    setSolutionOutput(null);
    setIsBlurryOrUnreadable(false);

    setAnalysisResult({
      detectedSubject: sample.subject,
      hasDiagram: sample.hasDiagram,
      diagramDescription: sample.diagramDescription,
      questions: [
        {
          id: 'q1',
          questionNumber: 'Q1',
          extractedText: sample.question,
          subject: sample.subject,
          topic: sample.topic,
        },
      ],
    });
    showToast(`Loaded Sample: ${sample.title}`);
  };

  // 6. Analyze Image using AI Vision Endpoint
  const handleAnalyzeImage = async () => {
    if (!selectedImageBase64 || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSolutionOutput(null);
    setIsBlurryOrUnreadable(false);

    try {
      const res = await AiService.analyzePhoto(selectedImageBase64, {
        mimeType,
        classLevel: profile.classLevel,
        language: selectedLanguage,
      });

      const analysis = res.analysis;
      setAnalysisResult(analysis);

      if (analysis.questions && analysis.questions.length > 0) {
        setSelectedQuestionIndex(0);
        setEditableQuestionText(analysis.questions[0].extractedText);
      } else if (analysis.rawOcrText) {
        setEditableQuestionText(analysis.rawOcrText);
      }

      // Check if text is suspiciously short or unreadable
      const extractedText = analysis.questions[0]?.extractedText || analysis.rawOcrText || '';
      if (extractedText.trim().length < 15) {
        setIsBlurryOrUnreadable(true);
      }

      if (analysis.detectedSubject) {
        const match = SUBJECT_OPTIONS.find(
          (s) => s.toLowerCase() === analysis.detectedSubject.toLowerCase()
        );
        setSelectedSubject(match || analysis.detectedSubject || 'Science');
      }

      setHasDiagram(analysis.hasDiagram || false);
      setDiagramDescription(analysis.diagramDescription || '');

      showToast(
        analysis.questions.length > 1
          ? `Detected ${analysis.questions.length} questions in photo!`
          : 'Extracted question from photo! Review or edit below.'
      );
    } catch (err) {
      console.error(err);
      setIsBlurryOrUnreadable(true);
      showToast('Image unclear. Please verify or type your question below.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectQuestionIndex = (idx: number) => {
    setSelectedQuestionIndex(idx);
    if (analysisResult?.questions[idx]) {
      const q = analysisResult.questions[idx];
      setEditableQuestionText(q.extractedText);
      if (q.subject) {
        const match = SUBJECT_OPTIONS.find(
          (s) => s.toLowerCase() === q.subject?.toLowerCase()
        );
        if (match) setSelectedSubject(match);
      }
    }
  };

  // 7. Generate Step-by-Step AI Solution with XP Anti-Abuse Protection
  const handleSolveQuestion = async (overrideSimpler?: boolean, overrideNotes?: string) => {
    if (!editableQuestionText.trim() || isSolving) return;
    setIsSolving(true);
    setSolutionOutput(null);
    setSavedNote(false);

    const useSimpler = overrideSimpler !== undefined ? overrideSimpler : isSimplerMode;
    const effectiveNotes = overrideNotes !== undefined ? overrideNotes : additionalNotes;

    try {
      const res = await AiService.solvePhoto(selectedImageBase64, {
        questionText: editableQuestionText,
        subject: selectedSubject,
        classLevel: profile.classLevel,
        language: selectedLanguage,
        hasDiagram,
        diagramDescription,
        additionalNotes: useSimpler
          ? `Explain in very simple, beginner-friendly terms with easy step-by-step points. ${effectiveNotes}`
          : effectiveNotes,
        mimeType,
      });

      setSolutionOutput(res.solution);

      // Award XP with Anti-Abuse Check
      const xpRes = StorageService.addPhotoSolverXp(30, editableQuestionText);
      showToast(xpRes.message);

      // Check ephemeral photo upload privacy preference
      const isEphemeral = PrivacyService.getPrivacyPreferences().ephemeralPhotoUpload;
      if (!isEphemeral) {
        // Save item to Scan History (saving lightweight metadata to avoid storage bloat)
        const historyItem: ScanHistoryItem = {
          id: `scan-${Date.now()}`,
          timestamp: new Date().toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          questionText: editableQuestionText,
          solutionText: res.solution,
          subject: selectedSubject,
          hasDiagram,
          thumbnailBase64: null, // do not store high-res images to preserve memory
          language: selectedLanguage,
        };
        StorageService.saveScanHistoryItem(historyItem);
        loadScanHistory();
      } else {
        showToast('🔒 Ephemeral Mode: Solved in-memory without persistent history.');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not fetch online solution. Rendering local structured solution.');
    } finally {
      setIsSolving(false);
    }
  };

  // 8. Action: "Explain Simpler"
  const handleExplainSimpler = () => {
    setIsSimplerMode(true);
    showToast('Generating simplified beginner breakdown...');
    handleSolveQuestion(true);
  };

  // 9. Action: "Translate" (Hindi / English Toggle)
  const handleTranslateToggle = async () => {
    const targetLang: 'en' | 'hi' = selectedLanguage === 'en' ? 'hi' : 'en';
    setSelectedLanguage(targetLang);
    showToast(`Translating solution to ${targetLang === 'hi' ? 'Hindi (हिंदी)' : 'English'}...`);
    setIsSolving(true);

    try {
      const res = await AiService.solvePhoto(selectedImageBase64, {
        questionText: editableQuestionText,
        subject: selectedSubject,
        classLevel: profile.classLevel,
        language: targetLang,
        hasDiagram,
        diagramDescription,
        additionalNotes: `Translate and present the solution completely in ${
          targetLang === 'hi' ? 'Hindi (हिंदी)' : 'English'
        }.`,
        mimeType,
      });
      setSolutionOutput(res.solution);
    } catch (err) {
      console.error(err);
      showToast('Could not translate right now. Please try again.');
    } finally {
      setIsSolving(false);
    }
  };

  // 10. Action: "Ask AI" -> Open Ask AI View initialized with Scanned Question
  const handleOpenAskAi = () => {
    if (!editableQuestionText.trim()) return;

    // Create a new conversation pre-filled with this question
    const convId = `conv-photo-${Date.now()}`;
    const newConv = {
      id: convId,
      title: `Photo Doubt: ${editableQuestionText.slice(0, 30)}...`,
      subjectMode: (selectedSubject.toLowerCase() === 'maths'
        ? 'maths'
        : selectedSubject.toLowerCase() === 'science'
        ? 'science'
        : selectedSubject.toLowerCase() === 'hindi'
        ? 'hindi'
        : 'general') as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: 'user' as const,
          text: `I solved this photo problem: "${editableQuestionText}". Can you explain more details about this topic?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `msg-${Date.now()}-2`,
          sender: 'ai' as const,
          text: `Sure! Regarding **"${editableQuestionText.slice(0, 50)}..."**: What specific doubt or concept would you like to explore deeper?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    StorageService.saveConversation(newConv);
    StorageService.setActiveConversationId(convId);
    showToast('Opening Ask AI with this scanned question...');
    handleNavigate('ask-ai');
  };

  // 11. Action: "Make Notes"
  const handleSaveToNotes = () => {
    if (!solutionOutput) return;
    StorageService.saveNote({
      id: `note-${Date.now()}`,
      title: `${selectedSubject} Solution: ${editableQuestionText.slice(0, 30)}...`,
      subjectName: selectedSubject,
      chapterName: 'Photo Homework Solver',
      contentMarkdown: solutionOutput,
      createdAt: 'Just now',
      tags: [selectedSubject, `Class ${profile.classLevel}`, 'Photo Solver'],
      isAiGenerated: true,
    });
    setSavedNote(true);
    showToast('+20 XP! Saved to Study Notes!');
    setTimeout(() => setSavedNote(false), 3000);
  };

  // 12. Action: "Create Quiz"
  const handleCreateQuizFromSolution = async () => {
    if (!editableQuestionText) return;
    showToast('Generating 3-question practice quiz...');
    try {
      const res = await AiService.generateQuiz(editableQuestionText.slice(0, 40), {
        subject: selectedSubject,
        classLevel: profile.classLevel,
      });

      if (res.quiz) {
        StorageService.addXp(20, 'Created Quiz from Photo Problem');
        showToast('Practice quiz created! Opening Quiz tab...');
        handleNavigate('quiz');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not generate quiz right now.');
    }
  };

  // 13. Copy and Share
  const handleCopySolution = () => {
    if (!solutionOutput) return;
    navigator.clipboard.writeText(`*Question*: ${editableQuestionText}\n\n*Solution*:\n${solutionOutput}`);
    setCopiedText(true);
    showToast('Copied full question & solution to clipboard!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShareSolution = async () => {
    if (!solutionOutput) return;
    const shareData = {
      title: `EduAI Photo Solution: ${selectedSubject}`,
      text: `Question: ${editableQuestionText}\n\nSolution Summary:\n${solutionOutput.slice(0, 300)}...`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!');
      } catch (err) {
        console.warn('Share cancelled or failed', err);
      }
    } else {
      handleCopySolution();
    }
  };

  const handleSpeakText = () => {
    if (!solutionOutput) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const plainText = solutionOutput
      .replace(/[#*`$\-\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 600);

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // 14. Scan History Item Loader
  const handleLoadHistoryItem = (item: ScanHistoryItem) => {
    setSelectedImageBase64(null);
    setOriginalImageBase64(null);
    setEditableQuestionText(item.questionText);
    setSolutionOutput(item.solutionText);
    setSelectedSubject(item.subject);
    setHasDiagram(item.hasDiagram || false);
    setSelectedLanguage(item.language || 'en');
    setIsHistoryOpen(false);
    showToast(`Loaded question from Scan History (${item.timestamp})`);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.deleteScanHistoryItem(id);
    loadScanHistory();
    showToast('Deleted item from history.');
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all scan history?')) {
      StorageService.clearScanHistory();
      loadScanHistory();
      showToast('Scan history cleared.');
    }
  };

  // Filtered history list
  const filteredHistory = scanHistory.filter((item) => {
    const matchesSubject =
      historySubjectFilter === 'All' ||
      item.subject.toLowerCase() === historySubjectFilter.toLowerCase();
    const matchesQuery =
      !historySearchQuery.trim() ||
      item.questionText.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      item.solutionText.toLowerCase().includes(historySearchQuery.toLowerCase());
    return matchesSubject && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-50 rounded-xl border border-purple-500 bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in slide-in-from-top duration-200 flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            AI Photo Homework Solver
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Snap textbook problems, diagrams, or handwritten questions for instant step-by-step solutions
          </p>
        </div>

        {/* Scan History Trigger & Language Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            aria-label="View Scan History"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-purple-300 hover:bg-purple-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all shadow-2xs active:scale-95"
          >
            <History className="h-4 w-4 text-purple-600" />
            <span>Scan History</span>
            {scanHistory.length > 0 && (
              <span className="rounded-full bg-purple-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                {scanHistory.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                selectedLanguage === 'en'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('hi')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                selectedLanguage === 'hi'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Left Column (Upload & Camera) | Right Column (Solution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload, Camera, Samples, OCR Edit */}
        <div className="lg:col-span-6 space-y-4">
          {/* Image Upload / Camera Container */}
          <Card
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative overflow-hidden transition-all border-2 border-dashed p-4 text-center ${
              selectedImageBase64
                ? 'border-purple-300 bg-purple-50/20 dark:border-purple-900 dark:bg-purple-950/10'
                : 'border-slate-300 bg-slate-50/50 hover:border-purple-400 dark:border-slate-700 dark:bg-slate-800/30'
            }`}
          >
            {/* Live Camera View */}
            {isCameraOpen ? (
              <div className="space-y-3">
                <div className="relative mx-auto max-h-64 overflow-hidden rounded-xl border border-slate-800 bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="mx-auto max-h-64 object-contain"
                  />
                  <div className="absolute top-2 right-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                    LIVE CAMERA
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    onClick={capturePhotoFromCamera}
                    className="flex items-center gap-2 rounded-xl border-2 border-purple-600 bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700 active:scale-95 transition-all"
                  >
                    <Camera className="h-4 w-4" />
                    Snap Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 active:scale-95 transition-all"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : selectedImageBase64 ? (
              /* Image Preview with Crop & Rotate Tools */
              <div className="space-y-3">
                <div className="relative mx-auto max-h-64 overflow-hidden rounded-xl border border-slate-200 bg-black/5 dark:border-slate-700 flex items-center justify-center">
                  <img
                    src={selectedImageBase64}
                    alt="Scanned Homework Problem"
                    className="mx-auto max-h-64 object-contain transition-transform duration-200"
                  />

                  {isCropMode && (
                    <div className="absolute inset-0 border-2 border-dashed border-purple-500 bg-purple-500/20 flex items-center justify-center">
                      <span className="rounded-md bg-purple-900/80 px-2 py-1 text-[10px] font-bold text-white">
                        Cropping Active
                      </span>
                    </div>
                  )}
                </div>

                {isCropMode && (
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                      <span>Adjust Crop Area (%):</span>
                      <button
                        onClick={handleApplyCrop}
                        className="rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-700 active:scale-95"
                      >
                        Apply Crop
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="text-slate-600 dark:text-slate-300">Width: {cropRect.width}%</label>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={cropRect.width}
                          onChange={(e) => setCropRect({ ...cropRect, width: Number(e.target.value) })}
                          className="w-full accent-purple-600"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 dark:text-slate-300">Height: {cropRect.height}%</label>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={cropRect.height}
                          onChange={(e) => setCropRect({ ...cropRect, height: Number(e.target.value) })}
                          className="w-full accent-purple-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Toolbar buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleRotate}
                    className="flex items-center gap-1.5 rounded-xl border border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-300 shadow-2xs active:scale-95 transition-all"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Rotate</span>
                  </button>

                  <button
                    onClick={() => setIsCropMode(!isCropMode)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-2xs active:scale-95 transition-all ${
                      isCropMode
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-purple-300 bg-white text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-300'
                    }`}
                  >
                    <Crop className="h-3.5 w-3.5" />
                    <span>{isCropMode ? 'Cancel Crop' : 'Crop Area'}</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-2xs active:scale-95 transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Replace</span>
                  </button>

                  <button
                    onClick={handleRemoveImage}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 shadow-2xs active:scale-95 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Empty Upload Prompt */
              <div className="space-y-3 py-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Drag & Drop or Capture Photo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Supports JPG, PNG, WEBP (Max 10MB) textbook pages, exam papers, or handwritten notes
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border-2 border-purple-600 bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 active:scale-95 transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image File
                  </button>

                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 rounded-xl border-2 border-purple-600 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 active:scale-95 transition-all"
                  >
                    <Camera className="h-4 w-4" />
                    Use Live Camera
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </Card>

          {/* Quick Sample Selector */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-purple-600" />
              Try A Sample Textbook Question:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_PROBLEMS.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSample(sample)}
                  className="p-2.5 text-left rounded-xl border border-slate-200 bg-white hover:border-purple-500 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all group active:scale-98"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-1">
                    {sample.title}
                  </p>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5 block">
                    {sample.subject} {sample.hasDiagram ? '• Diagram' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Vision Scan Trigger */}
          {selectedImageBase64 && !analysisResult && (
            <button
              onClick={handleAnalyzeImage}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-purple-600 bg-purple-600 py-3 text-xs font-bold text-white shadow-md hover:bg-purple-700 active:scale-98 transition-all disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>AI Scanning & Extracting Text...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Scan & Detect Questions with AI Vision</span>
                </>
              )}
            </button>
          )}

          {/* Blurry / Unreadable Image Warning Banner */}
          {isBlurryOrUnreadable && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Blurry or Unreadable Image Detected</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                The text in the photo could not be read clearly. Ensure good lighting, hold the textbook flat, or edit the extracted question text manually below.
              </p>
            </div>
          )}

          {/* Question Text Editor & Subject Configuration */}
          {(analysisResult || editableQuestionText) && (
            <Card className="space-y-3.5 border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2.5 dark:border-purple-800">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Edit3 className="h-4 w-4 text-purple-600" />
                  Extracted Question (Verify or Edit)
                </span>

                {hasDiagram && (
                  <Badge variant="purple" size="sm" icon={<Layers className="h-3 w-3" />}>
                    Diagram Detected
                  </Badge>
                )}
              </div>

              {/* Multi-question tabs */}
              {analysisResult && analysisResult.questions && analysisResult.questions.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    Multiple Questions Detected ({analysisResult.questions.length}): Select Question to Solve:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.questions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectQuestionIndex(idx)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          selectedQuestionIndex === idx
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-slate-800 dark:text-purple-300 dark:border-purple-800'
                        }`}
                      >
                        {q.questionNumber || `Question ${idx + 1}`} ({q.subject || 'Subject'})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Textarea */}
              <div>
                <textarea
                  value={editableQuestionText}
                  onChange={(e) => setEditableQuestionText(e.target.value)}
                  rows={4}
                  placeholder="Type or verify extracted question text..."
                  className="w-full resize-none rounded-xl border border-purple-200 bg-white p-3 text-xs sm:text-sm font-medium text-slate-800 focus:border-purple-500 focus:outline-none dark:border-purple-800 dark:bg-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              {/* Subject Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject Domain
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full rounded-xl border border-purple-200 bg-white p-2 text-xs font-bold text-purple-900 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-200"
                  >
                    {SUBJECT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Format Structure
                  </label>
                  <div className="rounded-xl border border-purple-200 bg-white p-2 text-[11px] font-bold text-purple-700 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-300 truncate">
                    {selectedSubject === 'Maths'
                      ? 'Given → Required → Formula → Steps'
                      : selectedSubject === 'Science'
                      ? 'Concept → Explanation → Answer'
                      : 'Answer → Explanation → Key Points'}
                  </div>
                </div>
              </div>

              {/* Additional Request Input */}
              <div>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Optional prompt modifier (e.g. highlight formula, focus on step 2)..."
                  className="w-full rounded-xl border border-purple-200 bg-white p-2 text-xs text-slate-800 dark:border-purple-800 dark:bg-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Solve Button */}
              <button
                onClick={() => handleSolveQuestion(false)}
                disabled={!editableQuestionText.trim() || isSolving}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-purple-600 bg-purple-600 py-3 text-xs font-bold text-white shadow-md hover:bg-purple-700 active:scale-98 transition-all disabled:opacity-50"
              >
                {isSolving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating Step-by-Step AI Solution...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Step-by-Step AI Solution (+30 XP)</span>
                  </>
                )}
              </button>
            </Card>
          )}
        </div>

        {/* Right Column: AI Solution Card & All Action Buttons */}
        <div className="lg:col-span-6">
          <Card className="min-h-[500px] h-full flex flex-col justify-between border-slate-200 dark:border-slate-800">
            {solutionOutput ? (
              <div className="space-y-4">
                {/* Solution Header Badges & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple" size="sm" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                      {isSimplerMode ? 'Simpler Explanation' : 'Full Solution Ready'}
                    </Badge>
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                      Class {profile.classLevel} {selectedSubject}
                    </span>
                  </div>

                  {/* Audio TTS, Copy, Share */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSpeakText}
                      className={`flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-bold transition-all active:scale-95 ${
                        isSpeaking
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                      }`}
                      title="Read Aloud"
                    >
                      {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                    </button>

                    <button
                      onClick={handleCopySolution}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all active:scale-95"
                      title="Copy Solution"
                    >
                      <Copy className="h-3.5 w-3.5 text-purple-600" />
                      <span className="hidden sm:inline">{copiedText ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleShareSolution}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all active:scale-95"
                      title="Share Solution"
                    >
                      <Share2 className="h-3.5 w-3.5 text-purple-600" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Solution Body */}
                <div className="p-1 max-h-[460px] overflow-y-auto">
                  <MarkdownRenderer content={solutionOutput} />
                </div>

                {/* All Required Action Buttons Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {/* 1. Ask AI Button */}
                    <button
                      onClick={handleOpenAskAi}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-2.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300 transition-all active:scale-95"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
                      <span>Ask AI</span>
                    </button>

                    {/* 2. Make Notes */}
                    <button
                      onClick={handleSaveToNotes}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition-all active:scale-95"
                    >
                      <BookMarked className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{savedNote ? 'Saved!' : 'Make Notes'}</span>
                    </button>

                    {/* 3. Create Quiz */}
                    <button
                      onClick={handleCreateQuizFromSolution}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 transition-all active:scale-95"
                    >
                      <Zap className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Create Quiz</span>
                    </button>

                    {/* 4. Explain Simpler */}
                    <button
                      onClick={handleExplainSimpler}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300 transition-all active:scale-95"
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                      <span>Explain Simpler</span>
                    </button>

                    {/* 5. Translate */}
                    <button
                      onClick={handleTranslateToggle}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300 transition-all active:scale-95"
                    >
                      <Languages className="h-3.5 w-3.5 text-sky-600" />
                      <span>{selectedLanguage === 'en' ? 'Translate Hindi' : 'Translate English'}</span>
                    </button>

                    {/* 6. Scan Another Question */}
                    <button
                      onClick={handleScanAnotherQuestion}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all active:scale-95"
                    >
                      <Camera className="h-3.5 w-3.5 text-purple-600" />
                      <span>Scan Another</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : isSolving ? (
              /* Loading Spinner State */
              <div className="my-auto text-center py-16 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950 animate-bounce">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    EduAI Master Teacher is Solving...
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Formulating Class {profile.classLevel} solution in {selectedSubject} ({selectedLanguage === 'hi' ? 'Hindi' : 'English'})
                  </p>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="my-auto text-center py-16 px-4 space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Solution Generated Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Upload a textbook photo or pick a sample question on the left to extract questions and view step-by-step AI solutions.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Scan History Modal / Drawer */}
      {isHistoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Scan History"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Scan History ({scanHistory.length})
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search solved questions..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:border-purple-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={historySubjectFilter}
                  onChange={(e) => setHistorySubjectFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
                >
                  <option value="All">All Subjects</option>
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadHistoryItem(item)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50/40 hover:border-purple-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="purple" size="sm">
                          {item.subject}
                        </Badge>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                        {item.questionText}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 space-y-2">
                  <History className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    No scan history items found matching filter.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {scanHistory.length > 0 && (
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 flex justify-between items-center">
                <button
                  onClick={handleClearAllHistory}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All History</span>
                </button>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

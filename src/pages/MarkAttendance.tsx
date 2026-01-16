import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Video,
  VideoOff,
  Check,
  X,
  Loader2,
  Scan,
  Users,
  AlertTriangle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { api, Subject } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DetectedStudent {
  student_id: number;
  name?: string;
  roll_no?: string;
  confidence: number;
  status: 'success' | 'warning' | 'error';
}

export const MarkAttendance: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedStudents, setDetectedStudents] = useState<DetectedStudent[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user?.id) return;
      try {
        const data = await api.getTeacherSubjects(user.id);
        setSubjects(data);
        if (data.length > 0) setSelectedSubject(data[0].subject_id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to fetch subjects');
      }
    };
    fetchSubjects();
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setCapturedImage(null);
        setDetectedStudents([]);
        setError(null);
      }
    } catch {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  }, []);

  const captureAndProcess = useCallback(async () => {
    if (!selectedSubject) {
      toast.error('Select a subject first');
      return;
    }
    if (!canvasRef.current || !videoRef.current) return;
    if (videoRef.current.readyState !== 4) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));

    setIsProcessing(true);
    setDetectedStudents([]);
    setError(null);

    canvas.toBlob(async (blob) => {
      try {
        if (!blob) throw new Error('Failed to capture image');
        const file = new File([blob], 'classroom.jpg', { type: 'image/jpeg' });
        const result = await api.markAttendance(selectedSubject, file);

        const students: DetectedStudent[] = (result.students_present || []).map((s) => ({
          student_id: s.student_id,
          name: s.name,
          roll_no: s.roll_no,
          confidence: s.confidence,
          status: s.confidence >= 0.85 ? 'success' : s.confidence >= 0.7 ? 'warning' : 'error',
        }));

        if (students.length === 0) {
          setError('No students detected in the image');
          toast.warning('No students detected. Try again with better lighting.');
          return;
        }

        for (let i = 0; i < students.length; i++) {
          await new Promise((r) => setTimeout(r, 150));
          setDetectedStudents((prev) => [...prev, students[i]]);
        }

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to mark attendance';
        setError(msg);
        toast.error(msg);
      } finally {
        setIsProcessing(false);
      }
    }, 'image/jpeg', 0.9);
  }, [selectedSubject]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-success';
    if (confidence >= 0.7) return 'text-warning';
    return 'text-destructive';
  };

  const getConfidenceBarColor = (confidence: number) => {
    if (confidence >= 0.85) return 'bg-success';
    if (confidence >= 0.7) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold">Mark Attendance</h1>
        <p className="text-muted-foreground">Open camera → capture → students get marked present</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <GlassCard hover={false} className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Select Subject:</span>
            {subjects.length === 0 ? (
              <span className="text-sm text-warning">No subjects found for this teacher.</span>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {subjects.map((s) => (
                  <motion.button
                    key={s.subject_id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSubject(s.subject_id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedSubject === s.subject_id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {s.name} ({s.class})
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard hover={false} className={`relative overflow-hidden ${isCameraActive ? 'ring-2 ring-primary/50' : ''}`}>
            <div className="aspect-video bg-secondary/50 rounded-lg overflow-hidden relative">
              {capturedImage && !isCameraActive ? (
                <img src={capturedImage} alt="Captured classroom" className="w-full h-full object-cover" />
              ) : isCameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {isProcessing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="text-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                          <Scan className="w-12 h-12 text-primary mx-auto mb-4" />
                        </motion.div>
                        <p className="text-lg font-medium">Detecting faces...</p>
                        <p className="text-sm text-muted-foreground">AI is analyzing the image</p>
                      </div>
                    </motion.div>
                  )}
                  {!isProcessing && (
                    <motion.div
                      className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Camera is off</p>
                    <p className="text-sm text-muted-foreground">Start the camera to mark attendance</p>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-6 flex gap-4">
              {!isCameraActive ? (
                <Button onClick={startCamera} className="flex-1 bg-primary hover:bg-primary/90" disabled={subjects.length === 0}>
                  <Video className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    <VideoOff className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                  <Button onClick={captureAndProcess} disabled={isProcessing} className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                    {isProcessing ? 'Processing...' : 'Capture & Mark'}
                  </Button>
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Detected Students
              </h2>
              {detectedStudents.length > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <AnimatedNumber value={detectedStudents.length} className="text-2xl font-bold text-primary" />
                  <span className="text-muted-foreground">detected</span>
                </motion.div>
              )}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              <AnimatePresence>
                {detectedStudents.map((s, index) => (
                  <motion.div
                    key={`${s.student_id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.04 }}
                    className={`flex items-center justify-between p-4 rounded-lg bg-secondary/50 border ${
                      s.status === 'success' ? 'border-success/30' : s.status === 'warning' ? 'border-warning/30' : 'border-destructive/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 + index * 0.04 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          s.status === 'success' ? 'bg-success/20' : s.status === 'warning' ? 'bg-warning/20' : 'bg-destructive/20'
                        }`}
                      >
                        {s.status === 'success' ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : s.status === 'warning' ? (
                          <span className="text-warning text-xs font-bold">!</span>
                        ) : (
                          <X className="w-5 h-5 text-destructive" />
                        )}
                      </motion.div>
                      <div>
                        <p className="font-medium">{s.name || `Student #${s.student_id}`}</p>
                        <p className="text-sm text-muted-foreground">{s.roll_no || `ID: ${s.student_id}`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getConfidenceColor(s.confidence)}`}>{(s.confidence * 100).toFixed(1)}%</p>
                      <div className="w-16 h-1.5 bg-secondary rounded-full mt-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.confidence * 100}%` }}
                          transition={{ delay: 0.15 + index * 0.04 }}
                          className={`h-full rounded-full ${getConfidenceBarColor(s.confidence)}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {detectedStudents.length === 0 && !isProcessing && !error && (
                <div className="text-center py-12">
                  <Scan className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No students detected yet</p>
                  <p className="text-sm text-muted-foreground">Capture to begin</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="glass-card px-6 py-4 flex items-center gap-3 bg-success/20 border-success/30">
              <Check className="w-6 h-6 text-success" />
              <div>
                <p className="font-medium">Attendance marked!</p>
                <p className="text-sm text-muted-foreground">{detectedStudents.length} present</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Video, 
  VideoOff, 
  Upload, 
  Check, 
  X, 
  Loader2,
  Scan,
  Users
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { api, AttendanceResult, Subject } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DetectedStudent {
  student_id: number;
  name: string;
  roll_no: string;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await api.getTeacherSubjects(user?.id || 1);
        setSubjects(data);
        if (data.length > 0) setSelectedSubject(data[0].subject_id);
      } catch {
        // Demo data
        const demoSubjects = [
          { subject_id: 1, name: 'Machine Learning', class: '3-CSE-A', total_classes: 42 },
          { subject_id: 2, name: 'Data Structures', class: '2-CSE-B', total_classes: 38 },
        ];
        setSubjects(demoSubjects);
        setSelectedSubject(demoSubjects[0].subject_id);
      }
    };
    fetchSubjects();
  }, [user]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      // Demo mode - simulate camera
      setIsCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraActive(false);
    setCapturedImage(null);
  };

  const captureAndProcess = async () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
    }

    setIsProcessing(true);
    setDetectedStudents([]);

    // Simulate processing with demo data
    await new Promise(resolve => setTimeout(resolve, 2000));

    const demoStudents: DetectedStudent[] = [
      { student_id: 1, name: 'Rahul Kumar', roll_no: '21CS001', confidence: 0.95, status: 'success' },
      { student_id: 2, name: 'Priya Sharma', roll_no: '21CS002', confidence: 0.92, status: 'success' },
      { student_id: 3, name: 'Amit Singh', roll_no: '21CS003', confidence: 0.88, status: 'success' },
      { student_id: 4, name: 'Neha Gupta', roll_no: '21CS004', confidence: 0.67, status: 'warning' },
      { student_id: 5, name: 'Vikram Patel', roll_no: '21CS005', confidence: 0.94, status: 'success' },
    ];

    // Animate students appearing one by one
    for (let i = 0; i < demoStudents.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setDetectedStudents(prev => [...prev, demoStudents[i]]);
    }

    setIsProcessing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-success';
    if (confidence >= 0.7) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Mark Attendance</h1>
        <p className="text-muted-foreground">AI-powered face recognition attendance system</p>
      </motion.div>

      {/* Subject Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <GlassCard hover={false} className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Select Subject:</span>
            <div className="flex gap-2 flex-wrap">
              {subjects.map((subject) => (
                <motion.button
                  key={subject.subject_id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSubject(subject.subject_id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSubject === subject.subject_id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {subject.name} ({subject.class})
                </motion.button>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard 
            hover={false} 
            className={`relative overflow-hidden ${isCameraActive ? 'pulse-border border-2' : ''}`}
          >
            <div className="aspect-video bg-secondary/50 rounded-lg overflow-hidden relative">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-background/80 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          <Scan className="w-12 h-12 text-primary mx-auto mb-4" />
                        </motion.div>
                        <p className="text-lg font-medium">Detecting faces...</p>
                        <p className="text-sm text-muted-foreground">AI is analyzing the image</p>
                      </div>
                    </motion.div>
                  )}
                  {/* Scan overlay effect */}
                  {isCameraActive && !isProcessing && (
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
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-6 flex gap-4">
              {!isCameraActive ? (
                <Button onClick={startCamera} className="flex-1 bg-primary hover:bg-primary/90">
                  <Video className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    <VideoOff className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                  <Button 
                    onClick={captureAndProcess} 
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    {isProcessing ? 'Processing...' : 'Capture & Mark'}
                  </Button>
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Detected Students
              </h2>
              {detectedStudents.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <AnimatedNumber value={detectedStudents.length} className="text-2xl font-bold text-primary" />
                  <span className="text-muted-foreground">detected</span>
                </motion.div>
              )}
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              <AnimatePresence>
                {detectedStudents.map((student, index) => (
                  <motion.div
                    key={student.student_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg bg-secondary/50 border ${
                      student.status === 'success' ? 'border-success/30' : 
                      student.status === 'warning' ? 'border-warning/30' : 'border-destructive/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 + index * 0.1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          student.status === 'success' ? 'bg-success/20' : 
                          student.status === 'warning' ? 'bg-warning/20' : 'bg-destructive/20'
                        }`}
                      >
                        {student.status === 'success' ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : student.status === 'warning' ? (
                          <span className="text-warning text-xs font-bold">!</span>
                        ) : (
                          <X className="w-5 h-5 text-destructive" />
                        )}
                      </motion.div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.roll_no}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getConfidenceColor(student.confidence)}`}>
                        {(student.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">confidence</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {detectedStudents.length === 0 && !isProcessing && (
                <div className="text-center py-12">
                  <Scan className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No students detected yet</p>
                  <p className="text-sm text-muted-foreground">Start the camera and capture to begin</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="glass-card px-6 py-4 flex items-center gap-3 bg-success/20 border-success/30">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                <Check className="w-6 h-6 text-success" />
              </motion.div>
              <div>
                <p className="font-medium">Attendance Marked Successfully!</p>
                <p className="text-sm text-muted-foreground">{detectedStudents.length} students marked present</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

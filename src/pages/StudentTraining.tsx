import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Video,
  VideoOff,
  Check,
  X,
  Loader2,
  Upload,
  UserPlus,
  RefreshCw,
  Hash
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface TrainingForm {
  name: string;
  roll_no: string;
  class_id: string; // keep as string for input
}

export const StudentTraining: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [form, setForm] = useState<TrainingForm>({
    name: '',
    roll_no: '',
    class_id: '',
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setCapturedImage(null);
        setCapturedFile(null);
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    if (videoRef.current.readyState !== 4) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // mirror preview capture
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `student_${form.roll_no || 'face'}.jpg`, { type: 'image/jpeg' });
        setCapturedFile(file);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  }, [form.roll_no, stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCapturedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    stopCamera();
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFormValid = () => {
    const classIdNum = Number(form.class_id);
    return (
      form.name.trim() &&
      form.roll_no.trim() &&
      Number.isFinite(classIdNum) &&
      classIdNum > 0 &&
      !!capturedFile
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedFile) return;

    const classIdNum = Number(form.class_id);
    if (!isFormValid()) {
      toast.error('Please fill Name, Roll No, Class ID, and capture/upload a photo.');
      return;
    }

    setIsProcessing(true);
    try {
      await api.registerStudent(form.roll_no, form.name, classIdNum, capturedFile);
      setRegistrationSuccess(true);
      toast.success('Student registered and face embedding saved.');

      setTimeout(() => {
        setForm({ name: '', roll_no: '', class_id: '' });
        resetCapture();
        setRegistrationSuccess(false);
      }, 2500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register student');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold">Training</h1>
        <p className="text-muted-foreground">Register students (face enrollment)</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Face Capture
            </h2>

            <div className="aspect-video bg-secondary/50 rounded-lg overflow-hidden relative mb-4">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />
              ) : isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-60 border-2 border-dashed border-primary/50 rounded-full" />
                  </div>
                  <motion.div
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-60" />
                    <p className="text-muted-foreground">Capture or upload a clear face photo</p>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

            <div className="flex gap-3">
              {!capturedImage ? (
                !isCameraActive ? (
                  <>
                    <Button onClick={startCamera} className="flex-1">
                      <Video className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      <VideoOff className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                    <Button onClick={capturePhoto} className="flex-1 bg-gradient-to-r from-primary to-accent">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture
                    </Button>
                  </>
                )
              ) : (
                <>
                  <Button onClick={resetCapture} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                  <div className="flex items-center gap-2 text-success">
                    <Check className="w-5 h-5" />
                    <span className="text-sm">Ready</span>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              Student Details
            </h2>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roll">Roll No</Label>
                <Input
                  id="roll"
                  value={form.roll_no}
                  onChange={(e) => setForm((p) => ({ ...p, roll_no: e.target.value }))}
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class ID</Label>
                <Input
                  id="class"
                  inputMode="numeric"
                  placeholder="e.g., 3"
                  value={form.class_id}
                  onChange={(e) => setForm((p) => ({ ...p, class_id: e.target.value }))}
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <AnimatePresence mode="wait">
                {registrationSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-center gap-3 p-4 rounded-lg bg-success/20 border border-success/30"
                  >
                    <Check className="w-6 h-6 text-success" />
                    <span className="font-medium text-success">Enrolled successfully!</span>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      disabled={!isFormValid() || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Register Student
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!capturedFile && (
                <p className="text-sm text-muted-foreground text-center">Capture or upload a photo to continue</p>
              )}
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

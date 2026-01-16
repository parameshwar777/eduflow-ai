import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Video, 
  VideoOff, 
  User,
  Check, 
  X, 
  Loader2,
  Upload,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface FormData {
  name: string;
  roll_no: string;
  year: string;
  branch: string;
  section: string;
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
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    roll_no: '',
    year: '',
    branch: '',
    section: ''
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setCapturedImage(null);
        setCapturedFile(null);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (canvasRef.current && videoRef.current && videoRef.current.readyState === 4) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Flip horizontally for mirror effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `student_${formData.roll_no || 'face'}.jpg`, { type: 'image/jpeg' });
            setCapturedFile(file);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  }, [formData.roll_no, stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      stopCamera();
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.roll_no.trim() !== '' &&
      formData.year !== '' &&
      formData.branch !== '' &&
      formData.section !== '' &&
      capturedFile !== null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid() || !capturedFile) {
      toast.error('Please fill all fields and capture a photo');
      return;
    }

    setIsProcessing(true);

    try {
      await api.registerStudent(
        formData.name,
        formData.roll_no,
        formData.year,
        formData.branch,
        formData.section,
        capturedFile
      );
      
      setRegistrationSuccess(true);
      toast.success('Student registered successfully!');
      
      // Reset form after success
      setTimeout(() => {
        setFormData({ name: '', roll_no: '', year: '', branch: '', section: '' });
        setCapturedImage(null);
        setCapturedFile(null);
        setRegistrationSuccess(false);
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register student';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Student Training</h1>
        <p className="text-muted-foreground">Register new students with face enrollment for AI recognition</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera / Photo Capture Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Face Capture
            </h2>

            <div className="aspect-video bg-secondary/50 rounded-lg overflow-hidden relative mb-4">
              {capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
              ) : isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  {/* Face guide overlay */}
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
                    <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Capture student photo</p>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex gap-3">
              {!capturedImage ? (
                <>
                  {!isCameraActive ? (
                    <>
                      <Button onClick={startCamera} className="flex-1">
                        <Video className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
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
                      <Button 
                        onClick={capturePhoto}
                        className="flex-1 bg-gradient-to-r from-primary to-accent"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Button onClick={resetCapture} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retake Photo
                  </Button>
                  <div className="flex items-center gap-2 text-success">
                    <Check className="w-5 h-5" />
                    <span className="text-sm">Photo captured</span>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Registration Form Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Student Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter student name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roll_no">Roll Number</Label>
                <Input
                  id="roll_no"
                  placeholder="e.g., 21CS045"
                  value={formData.roll_no}
                  onChange={(e) => handleInputChange('roll_no', e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={formData.year} onValueChange={(v) => handleInputChange('year', v)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={formData.branch} onValueChange={(v) => handleInputChange('branch', v)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSE">CSE</SelectItem>
                      <SelectItem value="ECE">ECE</SelectItem>
                      <SelectItem value="EEE">EEE</SelectItem>
                      <SelectItem value="MECH">MECH</SelectItem>
                      <SelectItem value="CIVIL">CIVIL</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={formData.section} onValueChange={(v) => handleInputChange('section', v)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Sec" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {registrationSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-center gap-3 p-4 rounded-lg bg-success/20 border border-success/30"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                    >
                      <Check className="w-6 h-6 text-success" />
                    </motion.div>
                    <span className="font-medium text-success">Student registered successfully!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      disabled={!isFormValid() || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
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
                <p className="text-sm text-muted-foreground text-center">
                  Please capture or upload a photo to continue
                </p>
              )}
            </form>
          </GlassCard>
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <GlassCard hover={false} className="p-4">
          <h3 className="font-semibold mb-3">📋 Guidelines for Face Enrollment</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success shrink-0" />
              Ensure good lighting on the face
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success shrink-0" />
              Face should be clearly visible
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success shrink-0" />
              Remove glasses if possible
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success shrink-0" />
              Look directly at the camera
            </li>
            <li className="flex items-center gap-2">
              <X className="w-4 h-4 text-destructive shrink-0" />
              Avoid shadows on face
            </li>
            <li className="flex items-center gap-2">
              <X className="w-4 h-4 text-destructive shrink-0" />
              Don't cover face with hair or accessories
            </li>
          </ul>
        </GlassCard>
      </motion.div>
    </div>
  );
};

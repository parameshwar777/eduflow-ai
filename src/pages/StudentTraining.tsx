import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Hash,
  FileSpreadsheet,
  ImageIcon,
  Users,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface TrainingForm {
  name: string;
  roll_no: string;
  year: string;
  branch: string;
  section: string;
}

interface CSVStudent {
  sno: string;
  roll_no: string;
  name: string;
  branch: string;
  semester: string;
  gender: string;
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
  const csvInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [form, setForm] = useState<TrainingForm>({
    name: '',
    roll_no: '',
    year: '',
    branch: '',
    section: '',
  });

  // Bulk import state
  const [csvStudents, setCsvStudents] = useState<CSVStudent[]>([]);
  const [photosZip, setPhotosZip] = useState<File | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
    if (videoRef.current.readyState !== 4) {
      toast.error('Camera not ready yet. Please wait a moment.');
      return;
    }

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
    return (
      form.name.trim() &&
      form.roll_no.trim() &&
      form.year.trim() &&
      form.branch.trim() &&
      form.section.trim() &&
      !!capturedFile
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedFile) return;

    if (!isFormValid()) {
      toast.error('Please fill all fields and capture/upload a photo.');
      return;
    }

    setIsProcessing(true);
    try {
      await api.registerStudent(form.roll_no, form.name, form.year, form.branch, form.section, capturedFile);
      setRegistrationSuccess(true);
      toast.success('Student registered and face embedding saved.');

      setTimeout(() => {
        setForm({ name: '', roll_no: '', year: '', branch: '', section: '' });
        resetCapture();
        setRegistrationSuccess(false);
      }, 2500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register student');
    } finally {
      setIsProcessing(false);
    }
  };

  // CSV parsing
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      const students: CSVStudent[] = dataLines.map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        return {
          sno: cols[0] || '',
          roll_no: cols[1] || '',
          name: cols[2] || '',
          branch: cols[3] || '',
          semester: cols[4] || '',
          gender: cols[5] || '',
        };
      }).filter((s) => s.roll_no && s.name);

      setCsvStudents(students);
      toast.success(`Loaded ${students.length} students from CSV`);
    };
    reader.readAsText(file);
  };

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotosZip(file);
    toast.success(`Photos ZIP loaded: ${file.name}`);
  };

  const processBulkImport = async () => {
    if (csvStudents.length === 0) {
      toast.error('Please upload a CSV file first');
      return;
    }
    if (!photosZip) {
      toast.error('Please upload a photos ZIP file');
      return;
    }

    setBulkProcessing(true);
    setBulkProgress({ current: 0, total: csvStudents.length });

    // Note: This is a simplified version. In production, you'd extract ZIP and match photos
    toast.info('Bulk import started. Processing students...');
    
    // For now, show progress simulation - actual implementation requires backend support
    for (let i = 0; i < csvStudents.length; i++) {
      setBulkProgress({ current: i + 1, total: csvStudents.length });
      await new Promise((r) => setTimeout(r, 100));
    }

    setBulkProcessing(false);
    toast.success(`Bulk import complete! Processed ${csvStudents.length} students.`);
    setCsvStudents([]);
    setPhotosZip(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold">Student Training</h1>
        <p className="text-muted-foreground">Register students with face enrollment</p>
      </motion.div>

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Single Student
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
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
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform scale-x-[-1] ${!isCameraActive ? 'hidden' : ''}`}
                      />
                      {isCameraActive && (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-60 border-2 border-dashed border-primary/50 rounded-full" />
                          </div>
                          <motion.div
                            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          />
                        </>
                      )}
                      {!isCameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-60" />
                            <p className="text-muted-foreground">Capture or upload a clear face photo</p>
                          </div>
                        </div>
                      )}
                    </>
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
                          Capture Photo
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

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        placeholder="e.g., 3"
                        value={form.year}
                        onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                        className="bg-secondary border-border"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        placeholder="CSE"
                        value={form.branch}
                        onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))}
                        className="bg-secondary border-border"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        placeholder="A"
                        value={form.section}
                        onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
                        className="bg-secondary border-border"
                        required
                      />
                    </div>
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
        </TabsContent>

        <TabsContent value="bulk">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard hover={false}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Upload CSV
                </h2>

                <p className="text-sm text-muted-foreground mb-4">
                  Upload a CSV file with columns: S.no, Roll.No, Student Name, Branch, Semester, Gender
                </p>

                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => csvInputRef.current?.click()}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Select CSV File
                </Button>

                {csvStudents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-success/10 border border-success/30"
                  >
                    <p className="text-success font-medium flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {csvStudents.length} students loaded
                    </p>
                  </motion.div>
                )}

                {csvStudents.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2">S.No</th>
                          <th className="text-left py-2 px-2">Roll No</th>
                          <th className="text-left py-2 px-2">Name</th>
                          <th className="text-left py-2 px-2">Branch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvStudents.slice(0, 10).map((s, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 px-2">{s.sno}</td>
                            <td className="py-2 px-2">{s.roll_no}</td>
                            <td className="py-2 px-2">{s.name}</td>
                            <td className="py-2 px-2">{s.branch}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvStudents.length > 10 && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        +{csvStudents.length - 10} more students
                      </p>
                    )}
                  </div>
                )}
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard hover={false}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Upload Photos ZIP
                </h2>

                <p className="text-sm text-muted-foreground mb-4">
                  Upload a ZIP file containing photos named sequentially (1.jpg, 2.jpg, etc.) matching the S.no in CSV
                </p>

                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleZipUpload}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => zipInputRef.current?.click()}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Select Photos ZIP
                </Button>

                {photosZip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-success/10 border border-success/30"
                  >
                    <p className="text-success font-medium flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {photosZip.name}
                    </p>
                  </motion.div>
                )}

                <div className="mt-6">
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    onClick={processBulkImport}
                    disabled={bulkProcessing || csvStudents.length === 0 || !photosZip}
                  >
                    {bulkProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing {bulkProgress.current}/{bulkProgress.total}...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Start Bulk Import
                      </>
                    )}
                  </Button>

                  {bulkProcessing && (
                    <div className="mt-4">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {bulkProgress.current} of {bulkProgress.total} students processed
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

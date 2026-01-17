import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Loader2,
  Users,
  Search,
  Upload,
  FileSpreadsheet,
  ImageIcon,
  Check,
  X,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Student {
  id: number;
  roll_no: string;
  name: string;
  branch: string;
  semester: string;
  gender: string;
}

interface CSVStudent {
  sno: string;
  roll_no: string;
  name: string;
  branch: string;
  semester: string;
  gender: string;
}

export const StudentsManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Single student modal
  const [showModal, setShowModal] = useState(false);

  // Bulk import state
  const [csvStudents, setCsvStudents] = useState<CSVStudent[]>([]);
  const [photosZip, setPhotosZip] = useState<File | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const csvInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      const parsedStudents: CSVStudent[] = dataLines.map((line) => {
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

      setCsvStudents(parsedStudents);
      toast.success(`Loaded ${parsedStudents.length} students from CSV`);
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

    toast.info('Bulk import started. Processing students...');
    
    // Import students and add to list
    const importedStudents: Student[] = [];
    
    for (let i = 0; i < csvStudents.length; i++) {
      const csv = csvStudents[i];
      setBulkProgress({ current: i + 1, total: csvStudents.length });
      
      // Add to local list (actual API call would go here with extracted photos)
      importedStudents.push({
        id: i + 1,
        roll_no: csv.roll_no,
        name: csv.name,
        branch: csv.branch,
        semester: csv.semester,
        gender: csv.gender,
      });
      
      await new Promise((r) => setTimeout(r, 50));
    }

    setStudents((prev) => [...prev, ...importedStudents]);
    setBulkProcessing(false);
    toast.success(`Bulk import complete! Added ${csvStudents.length} students.`);
    setCsvStudents([]);
    setPhotosZip(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Students Management</h1>
          <p className="text-muted-foreground">Manage registered students</p>
        </div>
      </motion.div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Students List
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <GlassCard hover={false}>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No students found</p>
                <p className="text-sm text-muted-foreground">Import students using the Bulk Import tab</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Roll No</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Branch</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Semester</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredStudents.map((student, index) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="border-b border-border/50 hover:bg-secondary/30"
                        >
                          <td className="py-3 px-4 font-mono text-sm">{student.roll_no}</td>
                          <td className="py-3 px-4 font-medium">{student.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{student.branch}</td>
                          <td className="py-3 px-4 text-muted-foreground">{student.semester}</td>
                          <td className="py-3 px-4 text-muted-foreground">{student.gender}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="import">
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
                  className="w-full h-24 border-dashed"
                  onClick={() => csvInputRef.current?.click()}
                >
                  <div className="text-center">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm">Click to upload CSV</span>
                  </div>
                </Button>

                {csvStudents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-success" />
                      <span className="text-sm text-success">{csvStudents.length} students loaded</span>
                    </div>
                  </motion.div>
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
                  Upload a ZIP file containing student photos named sequentially (1.jpg, 2.jpg, ...)
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
                  className="w-full h-24 border-dashed"
                  onClick={() => zipInputRef.current?.click()}
                >
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm">Click to upload ZIP</span>
                  </div>
                </Button>

                {photosZip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-success" />
                      <span className="text-sm text-success truncate">{photosZip.name}</span>
                    </div>
                  </motion.div>
                )}
              </GlassCard>
            </motion.div>
          </div>

          {/* Upload Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <GlassCard hover={false}>
              {bulkProcessing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing students...</span>
                    <span className="text-sm text-muted-foreground">
                      {bulkProgress.current} / {bulkProgress.total}
                    </span>
                  </div>
                  <Progress value={(bulkProgress.current / bulkProgress.total) * 100} />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ready to import?</p>
                    <p className="text-sm text-muted-foreground">
                      {csvStudents.length > 0 && photosZip
                        ? `${csvStudents.length} students with photos ready`
                        : 'Upload both CSV and ZIP files to continue'}
                    </p>
                  </div>
                  <Button
                    onClick={processBulkImport}
                    disabled={csvStudents.length === 0 || !photosZip}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Import
                  </Button>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Preview Table */}
          {csvStudents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <GlassCard hover={false}>
                <h3 className="text-lg font-semibold mb-4">Preview ({csvStudents.length} students)</h3>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3">S.No</th>
                        <th className="text-left py-2 px-3">Roll No</th>
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Branch</th>
                        <th className="text-left py-2 px-3">Semester</th>
                        <th className="text-left py-2 px-3">Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvStudents.slice(0, 10).map((student, index) => (
                        <tr key={index} className="border-b border-border/50">
                          <td className="py-2 px-3">{student.sno}</td>
                          <td className="py-2 px-3 font-mono">{student.roll_no}</td>
                          <td className="py-2 px-3">{student.name}</td>
                          <td className="py-2 px-3">{student.branch}</td>
                          <td className="py-2 px-3">{student.semester}</td>
                          <td className="py-2 px-3">{student.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvStudents.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      ...and {csvStudents.length - 10} more
                    </p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

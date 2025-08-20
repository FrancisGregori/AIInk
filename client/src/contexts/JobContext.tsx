import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Job {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  type: 'stencil' | 'design';
  originalImageUrl?: string;
  processedImageUrl?: string;
  style?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

interface JobContextType {
  activeJobs: Job[];
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  removeJob: (jobId: string) => void;
  getJob: (jobId: string) => Job | undefined;
  hasActiveJobs: boolean;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);

  // Cargar jobs del localStorage al inicializar
  useEffect(() => {
    const savedJobs = localStorage.getItem('tattoo-stencil-jobs');
    if (savedJobs) {
      try {
        const jobs = JSON.parse(savedJobs);
        setActiveJobs(jobs);
      } catch (error) {
        console.error('Error loading saved jobs:', error);
        localStorage.removeItem('tattoo-stencil-jobs');
      }
    }
  }, []);

  // Guardar jobs en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('tattoo-stencil-jobs', JSON.stringify(activeJobs));
  }, [activeJobs]);

  const addJob = (job: Job) => {
    setActiveJobs(prev => [...prev, job]);
  };

  const updateJob = (jobId: string, updates: Partial<Job>) => {
    setActiveJobs(prev => 
      prev.map(job => 
        job.id === jobId ? { ...job, ...updates } : job
      )
    );
  };

  const removeJob = (jobId: string) => {
    setActiveJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const getJob = (jobId: string) => {
    return activeJobs.find(job => job.id === jobId);
  };

  const hasActiveJobs = activeJobs.some(job => job.status === 'processing');

  return (
    <JobContext.Provider value={{
      activeJobs,
      addJob,
      updateJob,
      removeJob,
      getJob,
      hasActiveJobs
    }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
}
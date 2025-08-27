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
    try {
      // Limpiar jobs completados antiguos para evitar llenar el localStorage
      const cleanedJobs = activeJobs.filter(job => {
        if (job.status === 'completed' && job.completedAt) {
          const completedDate = new Date(job.completedAt);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return completedDate > oneDayAgo; // Mantener solo trabajos completados en las últimas 24h
        }
        return true; // Mantener trabajos en progreso y fallidos
      });

      // Si hay demasiados jobs, mantener solo los más recientes
      const maxJobs = 20;
      const finalJobs = cleanedJobs.length > maxJobs 
        ? cleanedJobs.slice(-maxJobs)
        : cleanedJobs;

      localStorage.setItem('tattoo-stencil-jobs', JSON.stringify(finalJobs));
      
      // Si los jobs fueron limpiados, actualizar el estado
      if (finalJobs.length !== activeJobs.length) {
        setActiveJobs(finalJobs);
      }
    } catch (error) {
      console.error('Error saving jobs to localStorage:', error);
      // Si falla, limpiar localStorage y mantener solo jobs en progreso
      try {
        const essentialJobs = activeJobs.filter(job => job.status === 'processing');
        localStorage.setItem('tattoo-stencil-jobs', JSON.stringify(essentialJobs));
        setActiveJobs(essentialJobs);
      } catch (fallbackError) {
        console.error('Failed to save essential jobs, clearing localStorage:', fallbackError);
        localStorage.removeItem('tattoo-stencil-jobs');
      }
    }
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
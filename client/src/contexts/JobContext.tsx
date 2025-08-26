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

  const MAX_STORAGE_BYTES = 4.5 * 1024 * 1024; // ~4.5MB para dejar margen del límite de 5MB

  const serializeJobs = (jobs: Job[]) => {
    // Serializar solo datos esenciales, excluyendo URLs base64 grandes
    const essential = jobs.map(({ id, status, type, style, startedAt, completedAt, errorMessage, originalImageUrl, processedImageUrl }) => ({
      id,
      status,
      type,
      style,
      startedAt,
      completedAt,
      errorMessage,
      // Excluir URLs base64 (data:) que son muy grandes
      ...(originalImageUrl && !originalImageUrl.startsWith('data:') ? { originalImageUrl } : {}),
      ...(processedImageUrl && !processedImageUrl.startsWith('data:') ? { processedImageUrl } : {})
    }));
    return JSON.stringify(essential);
  };

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

      const serialized = serializeJobs(finalJobs);
      const payloadSize = new Blob([serialized]).size;
      
      if (payloadSize <= MAX_STORAGE_BYTES) {
        localStorage.setItem('tattoo-stencil-jobs', serialized);
      } else {
        console.warn('Skipping job persistence: payload too large for localStorage');
      }

      // Si los jobs fueron limpiados, actualizar el estado
      if (finalJobs.length !== activeJobs.length) {
        setActiveJobs(finalJobs);
      }
    } catch (error) {
      console.error('Error saving jobs to localStorage:', error);
      // Si falla, mantener solo jobs en progreso sin imágenes pesadas
      try {
        const essentialJobs = activeJobs.filter(job => job.status === 'processing');
        const serialized = serializeJobs(essentialJobs);
        const payloadSize = new Blob([serialized]).size;
        
        if (payloadSize <= MAX_STORAGE_BYTES) {
          localStorage.setItem('tattoo-stencil-jobs', serialized);
          setActiveJobs(essentialJobs);
        } else {
          console.warn('Essential jobs exceed storage limit, clearing localStorage');
          localStorage.removeItem('tattoo-stencil-jobs');
        }
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
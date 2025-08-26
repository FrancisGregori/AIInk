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

  // Límite conservador para evitar QuotaExceededError
  const MAX_STORAGE_BYTES = 2 * 1024 * 1024; // 2MB - mucho más conservador
  const STORAGE_KEY = 'tattoo-stencil-jobs';

  const serializeJobs = (jobs: Job[]) => {
    // Serializar solo metadatos esenciales, NUNCA incluir imágenes base64
    const essential = jobs.map(({ id, status, type, style, startedAt, completedAt, errorMessage, originalImageUrl, processedImageUrl }) => ({
      id,
      status,
      type,
      style,
      startedAt,
      completedAt,
      errorMessage,
      // Solo incluir URLs si son rutas HTTP/HTTPS normales, NO base64
      ...(originalImageUrl && originalImageUrl.startsWith('http') ? { originalImageUrl } : {}),
      ...(processedImageUrl && processedImageUrl.startsWith('http') ? { processedImageUrl } : {})
    }));
    return JSON.stringify(essential);
  };

  // Cargar jobs del localStorage al inicializar
  useEffect(() => {
    try {
      const savedJobs = localStorage.getItem(STORAGE_KEY);
      if (savedJobs) {
        const jobs = JSON.parse(savedJobs);
        // Validar que sea un array antes de usar
        if (Array.isArray(jobs)) {
          setActiveJobs(jobs);
        } else {
          console.warn('Invalid jobs data in localStorage');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Guardar jobs en localStorage cuando cambian
  useEffect(() => {
    // Función helper para guardar de forma segura
    const safeSetItem = (key: string, value: string): boolean => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e: any) {
        // Detectar específicamente QuotaExceededError
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          console.warn('QuotaExceededError: localStorage is full');
          // Intentar limpiar y reintentar
          try {
            localStorage.removeItem(key);
            localStorage.setItem(key, value);
            return true;
          } catch {
            return false;
          }
        }
        console.error('localStorage error:', e);
        return false;
      }
    };

    try {
      // Limpiar jobs completados antiguos
      const cleanedJobs = activeJobs.filter(job => {
        if (job.status === 'completed' && job.completedAt) {
          const completedDate = new Date(job.completedAt);
          const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000); // Más agresivo: 6h
          return completedDate > sixHoursAgo;
        }
        return true; // Mantener trabajos en progreso y fallidos
      });

      // Límite más estricto de jobs
      const maxJobs = 10; // Reducido de 20 a 10
      const finalJobs = cleanedJobs.length > maxJobs
        ? cleanedJobs.slice(-maxJobs)
        : cleanedJobs;

      const serialized = serializeJobs(finalJobs);
      const payloadSize = new Blob([serialized]).size;
      
      if (payloadSize <= MAX_STORAGE_BYTES) {
        const saved = safeSetItem(STORAGE_KEY, serialized);
        if (!saved) {
          console.warn('Could not save jobs to localStorage (quota exceeded)');
        }
      } else {
        console.warn(`Job payload too large: ${(payloadSize / 1024 / 1024).toFixed(2)}MB, max: ${(MAX_STORAGE_BYTES / 1024 / 1024).toFixed(2)}MB`);
      }

      // Si los jobs fueron limpiados, actualizar el estado
      if (finalJobs.length !== activeJobs.length) {
        setActiveJobs(finalJobs);
      }
    } catch (error) {
      console.error('Error in job persistence:', error);
      // En caso de error crítico, solo mantener jobs en progreso
      try {
        const essentialJobs = activeJobs.filter(job => job.status === 'processing');
        if (essentialJobs.length > 0) {
          const serialized = serializeJobs(essentialJobs.slice(-5)); // Solo últimos 5
          safeSetItem(STORAGE_KEY, serialized);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (fallbackError) {
        console.error('Critical error in job persistence, clearing:', fallbackError);
        localStorage.removeItem(STORAGE_KEY);
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
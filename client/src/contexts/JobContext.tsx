import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Job persistence policy
 * ----------------------
 * - Only lightweight metadata is stored in localStorage.
 * - Any base64, blob or data URLs are stripped before serialization.
 * - Completed jobs are removed immediately and total jobs over 5 are pruned.
 * - If the serialized payload exceeds ~0.5MB it is **not** written to storage and
 *   the user is warned with a toast and guidance to clear history.
 */

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
  const { toast } = useToast();

  // More conservative limit (~0.5MB) to avoid QuotaExceededError
  const MAX_STORAGE_BYTES = 0.5 * 1024 * 1024; // 0.5MB
  const STORAGE_KEY = 'tattoo-stencil-jobs';

  const isHttpUrl = (url?: string) => !!url && /^https?:\/\//.test(url);

  const serializeJobs = (jobs: Job[]) => {
    // Keep only essential metadata and ensure large payloads aren't stored
    const essential = jobs.map(({ id, status, type, style, startedAt, completedAt, errorMessage, originalImageUrl, processedImageUrl }) => ({
      id,
      status,
      type,
      style,
      startedAt,
      completedAt,
      // Truncate possible large error messages
      ...(errorMessage ? { errorMessage: errorMessage.slice(0, 200) } : {}),
      // Only include http/https URLs, never base64/blob/data URLs
      ...(isHttpUrl(originalImageUrl) ? { originalImageUrl } : {}),
      ...(isHttpUrl(processedImageUrl) ? { processedImageUrl } : {})
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
      // Remove completed jobs immediately
      const cleanedJobs = activeJobs.filter(job => job.status !== 'completed');

      // Aggressive job limit
      const maxJobs = 5;
      const finalJobs = cleanedJobs.length > maxJobs
        ? cleanedJobs.slice(-maxJobs)
        : cleanedJobs;

      const serialized = serializeJobs(finalJobs);
      const payloadSize = new Blob([serialized]).size;

      if (payloadSize <= MAX_STORAGE_BYTES) {
        const saved = safeSetItem(STORAGE_KEY, serialized);
        if (!saved) {
          console.warn('Could not save jobs to localStorage (quota exceeded)');
          toast({
            title: 'Storage full',
            description: 'Could not save job history. Please clear your job history and try again.',
          });
        }
      } else {
        console.warn(`Job payload too large: ${(payloadSize / 1024 / 1024).toFixed(2)}MB, max: ${(MAX_STORAGE_BYTES / 1024 / 1024).toFixed(2)}MB`);
        // Log detailed size metrics for debugging
        const metrics = activeJobs.map(job => {
          const fieldSizes: Record<string, number> = {};
          Object.entries(job).forEach(([key, value]) => {
            fieldSizes[key] = new Blob([JSON.stringify(value ?? '')]).size;
          });
          return { id: job.id, total: new Blob([JSON.stringify(job)]).size, ...fieldSizes };
        });
        console.table(metrics);
        toast({
          title: 'Job history not saved',
          description: 'Storage limit reached. Please clear your job history and try again.',
        });
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
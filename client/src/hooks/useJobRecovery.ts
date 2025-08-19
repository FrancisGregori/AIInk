import { useEffect, useState } from 'react';
import { useJobs } from '@/contexts/JobContext';

export function useJobRecovery(jobType: 'stencil' | 'design') {
  const { activeJobs, updateJob } = useJobs();
  const [recoveredJobs, setRecoveredJobs] = useState<string[]>([]);

  useEffect(() => {
    // Find jobs of the current type that are still processing
    const activeJobsOfType = activeJobs.filter(job => 
      job.type === jobType && job.status === 'processing'
    );

    if (activeJobsOfType.length === 0) return;

    // Poll each active job to check status
    const intervals: NodeJS.Timeout[] = [];

    activeJobsOfType.forEach(job => {
      const interval = setInterval(async () => {
        try {
          const endpoint = jobType === 'stencil' 
            ? `/api/stencil/jobs/${job.id}` 
            : `/api/flux/jobs/${job.id}`;
          
          const response = await fetch(endpoint);
          if (response.ok) {
            const text = await response.text();
            
            // Verificar que la respuesta sea JSON válido
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
              console.warn(`Endpoint ${endpoint} returned HTML instead of JSON, skipping...`);
              return;
            }
            
            const updatedJob = JSON.parse(text);
            
            // Update job in global context
            updateJob(job.id, {
              status: updatedJob.status,
              processedImageUrl: updatedJob.processedImageUrl || undefined,
              completedAt: updatedJob.completedAt 
                ? (typeof updatedJob.completedAt === 'string' 
                    ? updatedJob.completedAt 
                    : updatedJob.completedAt.toISOString()) 
                : undefined,
              errorMessage: updatedJob.errorMessage || undefined
            });

            // If job is completed or failed, stop polling
            if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
              clearInterval(interval);
              setRecoveredJobs(prev => [...prev, job.id]);
            }
          } else if (response.status === 404) {
            // Job no longer exists on server, mark as failed and stop polling
            console.warn(`Job ${job.id} not found on server, removing from active jobs`);
            updateJob(job.id, {
              status: 'failed',
              errorMessage: 'Job not found on server'
            });
            clearInterval(interval);
          }
        } catch (error) {
          console.error(`Error checking job ${job.id}:`, error);
        }
      }, 3000); // Poll every 3 seconds

      intervals.push(interval);
    });

    // Cleanup intervals on unmount
    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [activeJobs, jobType, updateJob]);

  return {
    activeJobsOfType: activeJobs.filter(job => 
      job.type === jobType && job.status === 'processing'
    ),
    recoveredJobs
  };
}
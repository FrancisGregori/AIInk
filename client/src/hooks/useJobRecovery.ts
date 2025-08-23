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
            const updatedJob = await response.json();
            
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
            // Job not found - stop polling and mark as failed
            console.log(`Job ${job.id} not found, stopping polling`);
            updateJob(job.id, {
              status: 'failed',
              errorMessage: 'Job not found on server',
              completedAt: new Date().toISOString()
            });
            clearInterval(interval);
            setRecoveredJobs(prev => [...prev, job.id]);
          } else {
            // Other errors - increment retry count and potentially stop polling
            console.error(`Error fetching job ${job.id}:`, response.status);
          }
        } catch (error) {
          console.error(`Error checking job ${job.id}:`, error);
          // On network error, stop infinite retries after some attempts
          const retryCount = (interval as any).retryCount || 0;
          (interval as any).retryCount = retryCount + 1;
          
          if (retryCount >= 10) {
            console.log(`Too many failures for job ${job.id}, stopping polling`);
            updateJob(job.id, {
              status: 'failed',
              errorMessage: 'Network error - stopped polling',
              completedAt: new Date().toISOString()
            });
            clearInterval(interval);
            setRecoveredJobs(prev => [...prev, job.id]);
          }
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
export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any) => boolean;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  shouldRetry: () => true, // Retry on all errors by default
};

/**
 * Executes a promise-returning function with exponential backoff retry logic.
 * @param fn The function to execute
 * @param options Configuration for retry behavior
 * @returns The result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let retries = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= opts.maxRetries || !opts.shouldRetry(error)) {
        throw error; // Max retries reached or shouldn't retry this error
      }

      retries++;
      
      // Calculate delay with exponential backoff and jitter
      // 1st retry: ~1s, 2nd: ~2s, 3rd: ~4s, etc.
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, retries - 1),
        opts.maxDelayMs
      );
      
      // Add up to 20% jitter to prevent thundering herd problem
      const jitter = delay * 0.2 * Math.random();
      const finalDelay = delay + jitter;

      console.log(`[Retry] Attempt ${retries}/${opts.maxRetries} failed. Retrying in ${Math.round(finalDelay)}ms...`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
}

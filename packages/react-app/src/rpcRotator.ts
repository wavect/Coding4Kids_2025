// RPC Rotator - Manages multiple RPC endpoints with rotation and failover
export class RPCRotator {
  private endpoints: string[];
  private currentIndex: number = 0;
  private failedEndpoints: Set<string> = new Set();
  private lastHealthCheck: Map<string, number> = new Map();
  private readonly healthCheckInterval = 30000; // 30 seconds

  constructor(endpoints: string[]) {
    this.endpoints = [...endpoints];
    if (this.endpoints.length === 0) {
      throw new Error('At least one RPC endpoint is required');
    }
  }

  // Get the next RPC endpoint in rotation
  getNextEndpoint(): string {
    const healthyEndpoints = this.getHealthyEndpoints();
    
    if (healthyEndpoints.length === 0) {
      // If all endpoints are marked as failed, reset and try again
      console.warn('All RPC endpoints marked as failed, resetting...');
      this.failedEndpoints.clear();
      return this.endpoints[0];
    }

    // Find next healthy endpoint in rotation
    let attempts = 0;
    while (attempts < this.endpoints.length) {
      const endpoint = this.endpoints[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
      
      if (!this.failedEndpoints.has(endpoint)) {
        return endpoint;
      }
      attempts++;
    }

    // Fallback to first healthy endpoint
    return healthyEndpoints[0];
  }

  // Get current active endpoint without rotating
  getCurrentEndpoint(): string {
    const healthyEndpoints = this.getHealthyEndpoints();
    
    if (healthyEndpoints.length === 0) {
      return this.endpoints[0];
    }

    const currentEndpoint = this.endpoints[this.currentIndex];
    return this.failedEndpoints.has(currentEndpoint) ? healthyEndpoints[0] : currentEndpoint;
  }

  // Mark an endpoint as failed
  markAsFailed(endpoint: string): void {
    console.warn(`Marking RPC endpoint as failed: ${endpoint}`);
    this.failedEndpoints.add(endpoint);
    
    // Schedule health check retry
    setTimeout(() => {
      this.retryFailedEndpoint(endpoint);
    }, this.healthCheckInterval);
  }

  // Get all healthy endpoints
  private getHealthyEndpoints(): string[] {
    return this.endpoints.filter(endpoint => !this.failedEndpoints.has(endpoint));
  }

  // Retry a failed endpoint
  private async retryFailedEndpoint(endpoint: string): Promise<void> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      if (response.ok) {
        console.log(`RPC endpoint recovered: ${endpoint}`);
        this.failedEndpoints.delete(endpoint);
      }
    } catch (error) {
      console.warn(`RPC endpoint still failing: ${endpoint}`, error);
      // Schedule another retry
      setTimeout(() => {
        this.retryFailedEndpoint(endpoint);
      }, this.healthCheckInterval);
    }
  }

  // Get statistics about endpoints
  getStats() {
    return {
      total: this.endpoints.length,
      healthy: this.getHealthyEndpoints().length,
      failed: this.failedEndpoints.size,
      current: this.getCurrentEndpoint(),
    };
  }
}

// Sepolia RPC endpoints - mix of providers for redundancy
export const sepoliaRPCs = [
  "https://rpc.sepolia.ethpandaops.io",
  "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Public demo key
  "https://rpc.sepolia.org/",
  "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
  "https://rpc2.sepolia.org/",
  "https://sepolia.gateway.tenderly.co",
  "https://1rpc.io/sepolia",
];

// Create global RPC rotator instance
export const rpcRotator = new RPCRotator(sepoliaRPCs);

// Enhanced fetch function with RPC rotation and error handling
export async function fetchWithRotation(
  method: string,
  params: any[] = [],
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const endpoint = rpcRotator.getNextEndpoint();
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.warn(`RPC call failed on ${endpoint}:`, error);
      lastError = error as Error;
      
      // Mark endpoint as failed if it's a connection/network error
      if (error instanceof TypeError || (error as any).code === 'NETWORK_ERROR') {
        rpcRotator.markAsFailed(endpoint);
      }
    }
  }

  throw new Error(`All RPC attempts failed. Last error: ${lastError?.message}`);
} 
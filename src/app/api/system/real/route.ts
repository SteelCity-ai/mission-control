import { NextResponse } from 'next/server';
import http from 'http';

const TAILSCALE_SOCKET = process.env.TAILSCALE_SOCKET || '/var/run/tailscale/tailscaled.sock';
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://host.docker.internal:18789';

interface TailscaleStatus {
  available: boolean;
  ip?: string;
  hostname?: string;
  online?: boolean;
  peerCount?: number;
  error?: string;
}

interface GatewayStatus {
  available: boolean;
  reachable?: boolean;
  latencyMs?: number;
  error?: string;
}

interface DockerStatus {
  available: boolean;
  containerStats?: unknown;
  error?: string;
}

interface RealSystemData {
  tailscale: TailscaleStatus;
  gateway: GatewayStatus;
  docker: DockerStatus;
}

// Fetch Tailscale status via Unix socket
async function getTailscaleStatus(): Promise<TailscaleStatus> {
  return new Promise((resolve) => {
    try {
      const options = {
        socketPath: TAILSCALE_SOCKET,
        path: '/localapi/v0/status',
        method: 'GET',
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const status = JSON.parse(data);
            
            // Extract self node info
            const self = status?.Self;
            const peers = status?.Peer || {};
            const peerCount = Object.keys(peers).length;
            
            resolve({
              available: true,
              ip: self?.TailscaleIPs?.[0]?.replace('/64', '') || self?.TailscaleIPs?.[0] || '',
              hostname: self?.HostName || '',
              online: self?.Online === true,
              peerCount,
            });
          } catch (parseErr) {
            resolve({
              available: false,
              error: 'Failed to parse Tailscale status',
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          available: false,
          error: err.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          available: false,
          error: 'Request timeout',
        });
      });

      req.end();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      resolve({
        available: false,
        error,
      });
    }
  });
}

// Check OpenClaw Gateway status via HTTP
async function getGatewayStatus(): Promise<GatewayStatus> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    try {
      // Try to connect to the gateway health endpoint
      const url = new URL(GATEWAY_URL);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: '/api/health',
        method: 'GET',
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        const latency = Date.now() - startTime;
        const reachable = res.statusCode === 200;
        
        resolve({
          available: true,
          reachable,
          latencyMs: latency,
        });
      });

      req.on('error', (err) => {
        // If connection refused, gateway might not be running - that's OK
        if (err.message.includes('ECONNREFUSED')) {
          resolve({
            available: true,
            reachable: false,
            latencyMs: Date.now() - startTime,
          });
        } else {
          resolve({
            available: true,
            reachable: false,
            latencyMs: Date.now() - startTime,
            error: err.message,
          });
        }
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          available: true,
          reachable: false,
          latencyMs: Date.now() - startTime,
          error: 'Request timeout',
        });
      });

      req.end();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      resolve({
        available: false,
        error,
      });
    }
  });
}

// Get Docker container stats (basic info)
async function getDockerStats(): Promise<DockerStatus> {
  return new Promise((resolve) => {
    try {
      // Try to get container stats via Docker API
      const options = {
        socketPath: DOCKER_SOCKET,
        path: '/v1.41/containers/json?limit=1',
        method: 'GET',
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const containers = JSON.parse(data);
            resolve({
              available: true,
              containerStats: containers,
            });
          } catch {
            resolve({
              available: false,
              error: 'Failed to parse Docker stats',
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          available: false,
          error: err.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          available: false,
          error: 'Request timeout',
        });
      });

      req.end();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      resolve({
        available: false,
        error,
      });
    }
  });
}

export async function GET() {
  try {
    // Fetch all data in parallel
    const [tailscale, gateway, docker] = await Promise.all([
      getTailscaleStatus(),
      getGatewayStatus(),
      getDockerStats(),
    ]);

    const result: RealSystemData = {
      tailscale,
      gateway,
      docker,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching real system data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real system data' },
      { status: 500 }
    );
  }
}

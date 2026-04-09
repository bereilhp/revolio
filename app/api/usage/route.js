import { homedir } from "node:os";
import Docker from "dockerode";

const defaultSocket = "/var/run/docker.sock";
const macSocket = `${homedir()}/.docker/run/docker.sock`;

async function listUsage(socketPath) {
  const docker = new Docker({ socketPath });
  const runningContainers = await docker.listContainers({ all: false });

  const containers = await Promise.all(
    runningContainers.map(async (container) => {
      const stats = await docker
        .getContainer(container.Id)
        .stats({ stream: false });

      const cpuStats = stats.cpu_stats ?? {};
      const preCpuStats = stats.precpu_stats ?? {};
      const cpuDelta =
        (cpuStats.cpu_usage?.total_usage ?? 0) -
        (preCpuStats.cpu_usage?.total_usage ?? 0);
      const systemDelta =
        (cpuStats.system_cpu_usage ?? 0) - (preCpuStats.system_cpu_usage ?? 0);
      const cpuCount =
        cpuStats.online_cpus ?? cpuStats.cpu_usage?.percpu_usage?.length ?? 1;
      const cpuPercent =
        cpuDelta > 0 && systemDelta > 0
          ? (cpuDelta / systemDelta) * cpuCount * 100
          : 0;

      const memoryUsageBytes = stats.memory_stats?.usage ?? 0;
      const memoryLimitBytes = stats.memory_stats?.limit ?? 0;
      const memoryPercent =
        memoryLimitBytes > 0 ? (memoryUsageBytes / memoryLimitBytes) * 100 : 0;

      const networks = Object.values(stats.networks ?? {});
      const networkRxBytes = networks.reduce(
        (sum, network) => sum + (network.rx_bytes ?? 0),
        0,
      );
      const networkTxBytes = networks.reduce(
        (sum, network) => sum + (network.tx_bytes ?? 0),
        0,
      );

      return {
        id: container.Id,
        name: container.Names?.[0]?.replace(/^\//, "") ?? container.Id,
        image: container.Image,
        state: container.State,
        status: container.Status,
        cpuPercent,
        memoryUsageBytes,
        memoryLimitBytes,
        memoryPercent,
        networkRxBytes,
        networkTxBytes,
      };
    }),
  );

  return { socketPath, containers };
}

export async function GET() {
  try {
    const result = await listUsage(defaultSocket).catch(() =>
      listUsage(macSocket),
    );

    return Response.json({
      socketPath: result.socketPath,
      count: result.containers.length,
      containers: result.containers,
      collectedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to fetch container usage",
        message: String(error),
      },
      { status: 500 },
    );
  }
}

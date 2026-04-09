import { homedir } from "node:os";
import Docker from "dockerode";

const defaultSocket = "/var/run/docker.sock";
const macSocket = `${homedir()}/.docker/run/docker.sock`;

async function listRunning(socketPath) {
  const docker = new Docker({ socketPath });
  const containers = await docker.listContainers({ all: false });
  return { socketPath, containers };
}

export async function GET() {
  try {
    const result = await listRunning(defaultSocket).catch(() =>
      listRunning(macSocket),
    );

    return Response.json({
      socketPath: result.socketPath,
      count: result.containers.length,
      containers: result.containers.map((container) => ({
        id: container.Id,
        name: container.Names?.[0]?.replace(/^\//, "") ?? container.Id,
        image: container.Image,
        state: container.State,
        status: container.Status,
      })),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to list running containers",
        message: String(error),
      },
      { status: 500 },
    );
  }
}

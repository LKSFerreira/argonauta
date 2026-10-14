import net from 'node:net';

const caminhoPipe = process.argv[2];
if (!caminhoPipe) {
  process.exitCode = 3;
} else {
  const servidor = net.createServer((socket) => socket.destroy());
  servidor.once('error', () => {
    process.stdout.write('{"evento":"FALHA"}\n');
    process.exitCode = 3;
  });
  servidor.listen({ path: caminhoPipe, exclusive: true }, () => {
    process.stdout.write('{"evento":"PRONTO"}\n');
  });

  const encerrar = () => servidor.close(() => process.exit(0));
  process.once('SIGTERM', encerrar);
  process.once('SIGINT', encerrar);
}

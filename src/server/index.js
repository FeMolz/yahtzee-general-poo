import { DEFAULT_PORT } from "../shared/constants.js";
import { createGameServer } from "./socket.js";

const port = Number(process.env.PORT || DEFAULT_PORT);
const server = createGameServer();

server.listen(port, () => {
  console.log(`General server listening on port ${port}`);
});

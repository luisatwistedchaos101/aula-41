const express = require("express");
const rotas = require("./routes");
const tratadorDeErros = require("./middleware/tratadorDeErros");
const server = express();
const cors = require("cors");

server.use(express.json());

server.use(cors());
server.use(rotas);

server.use((_req, res, _next) =>
  res.status(404).json({ erro: "Rota não existe" })
);

server.use(tratadorDeErros);

server.listen(4321, () => console.log("Servidor está rodando!"));

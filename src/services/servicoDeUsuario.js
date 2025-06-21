const RepositorioDeUsuario = require("../repositories/repositorioDeUsuario");
const { Usuario } = require("../models/Usuario");
const { HttpError } = require("../errors/HttpError");
const jwt = require("jsonwebtoken");

class ServicoDeUsuario {
  async listarTodos() {
    return await RepositorioDeUsuario.listarTodos();
  }

  async pegarPeloID(id) {
    const usuario = await RepositorioDeUsuario.buscarPeloId(id);
    if (!usuario) throw new HttpError(404, "Usuário não encontrado!");

    return usuario;
  }

  async cadastrar({ nome, email, cpf, role, senha }, headers) {
    const senhaHash = await Usuario.criptografar(senha);

    const emailJaCadastrado = await RepositorioDeUsuario.buscarPeloEmail(email);
    if (emailJaCadastrado) throw new HttpError(409, "Usuário ja cadastrado.");

    const cpfJaCadastrado = await RepositorioDeUsuario.buscarPeloCpf(cpf);
    if (cpfJaCadastrado) throw new HttpError(409, "Usuário ja cadastrado.");

    if (role === "admin") throw new HttpError(403, "Método nao permitido.");

    if (role === "professor") {
      const authorization = headers["authorization"];

      if (!authorization) throw new HttpError(401, "Token não enviado.");

      const token = authorization.replace("Bearer ", "").trim();

      let payload;
      try {
        payload = jwt.verify(token, "senhaSecreta");
      } catch (err) {
        console.error("Erro ao verificar o token:", err);
        throw new HttpError(401, "Token inválido.");
      }

      if (payload.role !== "admin") {
        throw new HttpError(403, "Somente admin pode criar professores.");
      }

      const admin = await RepositorioDeUsuario.buscarPeloId(1);
      if (!admin) throw new HttpError(404, "Admin não encontrado.");

      if (admin.token.trim() !== token) {
        console.error("Token no banco e token enviado são diferentes!");
        throw new HttpError(403, "Token inválido para o admin.");
      }
    }

    return await RepositorioDeUsuario.criar({
      nome,
      email,
      cpf,
      senha: senhaHash,
      role
    });
  }

  async conectar({ email, senha }) {
    const usuarioEncontrado = await RepositorioDeUsuario.buscarPeloEmail(email);
    if (!usuarioEncontrado) throw new HttpError(404, "Usuário não encontrado.");

    const senhaCorreta = await Usuario.compararSenha(
      senha,
      usuarioEncontrado.senha
    );

    if (!senhaCorreta) throw new HttpError(401, "Senha incorreta.");

    const token = Usuario.gerarToken(usuarioEncontrado);
    await RepositorioDeUsuario.atualizarPeloId(usuarioEncontrado.id, { token });

    return token;
  }

  async atualizar(usuarioId, dadosNovos) {
    const usuarioExistente = await RepositorioDeUsuario.buscarPeloId(usuarioId);
    if (!usuarioExistente) throw new HttpError(404, "Usuário não encontrado!");

    const { nome, email, cpf, senha, role } = dadosNovos;

    const dadosAtualizados = {
      nome: nome ?? usuarioExistente.nome,
      email: email ?? usuarioExistente.email,
      cpf: cpf ?? usuarioExistente.cpf,
      role: role ?? usuarioExistente.role
    };

    if (senha) {
      dadosAtualizados.senha = await Usuario.criptografar(senha);
    }

    return await RepositorioDeUsuario.atualizarPeloId(
      usuarioId,
      dadosAtualizados
    );
  }

  async remover(id) {
    const usuarioExistente = await RepositorioDeUsuario.buscarPeloId(id);
    if (!usuarioExistente) {
      throw new HttpError(404, "Usuário nao encontrado!");
    }

    return await RepositorioDeUsuario.removerUsuarioPeloId(id);
  }
}

module.exports = new ServicoDeUsuario();

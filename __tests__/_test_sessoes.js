console.log = function () {};

const supertest = require("supertest");
const respPadrao = require("./config");
const sleep = require("./config");
const app = require("../server/config");
const banco = require("../server/banco");

var server = app.listen(52);

var id_filme_indisponivel = 0;
var id_filme_disponivel = 0;
var id_filme_inexistente = -1;
var id_sessao_inexistente = -1;
var id_sessao_teste = 0;

beforeAll(async () => {
  await banco.query(
    "insert into filmes (nome, cartaz, cartazURL, duracao, genero, classificacaoIndicativa, sinopse) values ('Filme Teste', '0', 'sem foto', '0h 10min', 'testes', 'Livre', 'Adicionando filme para teste'), ('Filme Teste 2', '1', 'sem foto', '0h 10min', 'testes', 'Livre', 'Adicionando filme 2 para teste')"
  );
  await banco.query(
    "select * from filmes where nome='Filme Teste'",
    async function (err, result) {
      id_filme_indisponivel = result[0].id;
    }
  );
  await banco.query(
    "select * from filmes where nome='Filme Teste 2'",
    async function (err, result) {
      id_filme_disponivel = result[0].id;
    }
  );
});

afterAll(async () => {
  await banco.query(
    `delete from sessoes where id_filme='${id_filme_disponivel}' OR id_filme='${id_filme_indisponivel}' OR id_filme='${id_filme_inexistente}'`
  );
  await banco.query(
    "delete from Filmes where nome='Filme Teste' OR nome='Filme Teste 2'"
  );
});

describe("GET Listar as Sessões Disponíveis /sessoesDisponiveis", () => {
  test("Listar as Sessões", async () => {
    const response = await supertest(app).get("/sessoesDisponiveis");

    expect(respPadrao(response)).toBe(true);
    expect(JSON.stringify(response.body)).toContain(`[{"nome":`);
    expect(JSON.stringify(response.body)).toContain(`,"duracao":"`);
    expect(JSON.stringify(response.body)).toContain(`,"genero":"`);
    expect(JSON.stringify(response.body)).toContain(
      `,"classificacaoIndicativa":"`
    );
    expect(JSON.stringify(response.body)).toContain(`,"sinopse":"`);
    expect(JSON.stringify(response.body)).toContain(`,"cartazURL":"`);
    expect(JSON.stringify(response.body)).toContain(`,"id":`);
    expect(JSON.stringify(response.body)).toContain(`,"horario":"`);
    expect(JSON.stringify(response.body)).toContain(`,"e3d":`);
    expect(JSON.stringify(response.body)).toContain(`,"idioma":"`);
    expect(JSON.stringify(response.body)).toContain(`,"sala":"`);
    expect(JSON.stringify(response.body)).toContain(`,"qtd_lugares":`);
    expect(JSON.stringify(response.body)).toContain(`}]`);
  });

  test("Listar as Sessões Disponíveis (Primeira sessao)", async () => {
    const response = await supertest(app).get("/sessoesDisponiveis");
    const result = await banco.query(
      "select * from sessoes where status=1 order by id_filme asc limit 1",
      async function (err, result) {
        expect(respPadrao(response)).toBe(true);
        expect(response.body[0].id).toBe(result[0].id);
      }
    );
  });
  test("Listar as Sessões Disponíveis (Ultima sessao)", async () => {
    const response = await supertest(app).get("/sessoesDisponiveis");
    const result = await banco.query(
      "select * from sessoes where status=1 order by id_filme desc limit 1",
      async function (err, result) {
        expect(respPadrao(response)).toBe(true);
        expect(response.body[response.body.length - 1].id).toBe(result[0].id);
      }
    );
  });
});

describe("GET Listar as Sessões /listarSessoes", () => {
  test("Listar as Sessões", async () => {
    const response = await supertest(app).get("/listarSessoes");

    expect(respPadrao(response)).toBe(true);
    expect(JSON.stringify(response.body)).toContain(`[{"nome":`);
    expect(JSON.stringify(response.body)).toContain(`,"duracao":"`);
    expect(JSON.stringify(response.body)).toContain(`,"genero":"`);
    expect(JSON.stringify(response.body)).toContain(
      `,"classificacaoIndicativa":"`
    );
    expect(JSON.stringify(response.body)).toContain(`,"sinopse":"`);
    expect(JSON.stringify(response.body)).toContain(`,"cartazURL":"`);
    expect(JSON.stringify(response.body)).toContain(`,"id":`);
    expect(JSON.stringify(response.body)).toContain(`,"horario":"`);
    expect(JSON.stringify(response.body)).toContain(`,"e3d":`);
    expect(JSON.stringify(response.body)).toContain(`,"idioma":"`);
    expect(JSON.stringify(response.body)).toContain(`,"sala":"`);
    expect(JSON.stringify(response.body)).toContain(`,"qtd_lugares":`);
    expect(JSON.stringify(response.body)).toContain(`}]`);
  });

  test("Listar as Sessões (Primeira sessao)", async () => {
    const response = await supertest(app).get("/listarSessoes");
    const result = await banco.query(
      "select * from sessoes order by id_filme asc limit 1",
      async function (err, result) {
        expect(respPadrao(response)).toBe(true);
        expect(response.body[0].id).toBe(result[0].id);
      }
    );
  });
  test("Listar as Sessões (Ultima sessao)", async () => {
    const response = await supertest(app).get("/listarSessoes");
    const result = await banco.query(
      "select * from sessoes order by id_filme desc limit 1",
      async function (err, result) {
        expect(respPadrao(response)).toBe(true);
        expect(response.body[response.body.length - 1].id).toBe(result[0].id);
      }
    );
  });
});

describe("Post Adicionar Sessão /criarSessao", () => {
  test("Adicionar Sessão (Filmes Inesxistente)", async () => {
    const response = await supertest(app).post("/criarSessao").send({
      id_filme: id_filme_inexistente,
      horario: "20:30",
      e3d: false,
      idioma: "legendado",
      sala: "3",
    });

    expect(respPadrao(response)).toBe(true);
    expect(response.text).toBe("Filme Inexistente!");
  });

  test("Adicionar Sessão (Filme Indisponível/Fora de cartaz)", async () => {
    const response = await supertest(app).post("/criarSessao").send({
      id_filme: id_filme_indisponivel,
      horario: "20:30",
      e3d: false,
      idioma: "legendado",
      sala: "3",
    });

    expect(respPadrao(response)).toBe(true);
    expect(response.text).toBe("Filme Indisponível/Fora de cartaz!");
  });

  test("Adicionar Sessão", async () => {
    const response = await supertest(app).post("/criarSessao").send({
      id_filme: id_filme_disponivel,
      horario: "20:30",
      e3d: false,
      idioma: "legendado",
      sala: "3",
    });

    expect(respPadrao(response)).toBe(true);
    expect(response.text).toBe("Sessão Criada com Sucesso!");
    await banco.query(
      `select * from sessoes where id_filme=${id_filme_disponivel}`,
      async function (err, result) {
        id_sessao_teste = result[0].id;
      }
    );
  });
});

describe("PUT Atualizar o status da Sessão /attStatusSessao/:id", () => {
  test("Atualizando Sessão (Filme Inexistente)", async () => {
    const response = await supertest(app).put(
      "/attStatusSessao/" + id_sessao_inexistente
    );

    expect(response.body.cod).toBe(0);
    expect(response.body.msg).toBe("Sessão Inexistente!");
  });
  test("Atualizando Sessão para indisponivel", async () => {
    const response = await supertest(app).put(
      "/attStatusSessao/" + id_sessao_teste
    );

    expect(response.body.cod).toBe(1);
    expect(response.body.msg).toBe("Sessão Atualizado!");
    expect(response.body.status).toBe(false);
  });
  test("Atualizando Sessão para disponivel", async () => {
    const response = await supertest(app).put(
      "/attStatusSessao/" + id_sessao_teste
    );

    expect(response.body.cod).toBe(1);
    expect(response.body.msg).toBe("Sessão Atualizado!");
    expect(response.body.status).toBe(true);
  });
});

server.close();

const { query } = require("../database");
const path = require("path");

exports.abrirCrudFuncionario = (req, res) => {
  console.log("funcionarioController - Rota /abrirCrudFuncionario - abrir o crudFuncionario");
  res.sendFile(path.join(__dirname, "../../frontend/funcionario/funcionario.html"));
};

// MODIFICADO: Agora retorna o nome da cargo junto com os dados do funcionario
exports.listarFuncionarios = async (req, res) => {
  try {
    // JOIN com a tabela cargo para obter o nome da cargo
    const result = await query(`
      SELECT 
        p.cpf,
        p.salario,
        p.id_cargo,
        c.nome_cargo
      FROM funcionario p
      INNER JOIN cargo c ON p.id_cargo = c.id_cargo
      ORDER BY p.cpf
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar funcionarios:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.criarFuncionario = async (req, res) => {
  console.log("REQ.BODY:", req.body);
  try {
    const { cpf, salario, id_cargo } = req.body;

    // Validação básica
    if (!cpf || !salario || !id_cargo) {
      return res.status(400).json({ 
        error: "CPF, salário e cargo são obrigatórios" 
      });
    }

    if (isNaN(salario)) {
      return res.status(400).json({ error: "Salário deve ser um número válido" });
    }

    if (isNaN(id_cargo)) {
      return res.status(400).json({ error: "ID do cargo deve ser um número válido" });
    }

    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.criarFuncionario({
        cpf, salario, id_cargo
      });
    } else {
      result = await query(
        "INSERT INTO funcionario (cpf, salario, id_cargo) VALUES ($1, $2, $3) RETURNING *",
        [cpf, salario, id_cargo]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar funcionario:", error);

    // Verifica se é erro de CPF duplicado
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Funcionário já existe para este CPF"
      });
    }

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === "23502") {
      return res.status(400).json({
        error: "Dados obrigatórios não fornecidos"
      });
    }

    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.obterFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "CPF deve ser um número válido" });
    }

    const result = await query(
      "SELECT * FROM funcionario WHERE cpf = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Funcionario não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao obter funcionario:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.atualizarFuncionario = async (req, res) => {
  console.log("REQ.BODY:", req.body); // <--- mostra o que chegou do frontend
  try {
    const id = parseInt(req.params.id);
    const { salario, id_cargo } = req.body;

    if (isNaN(salario)) {
      return res.status(400).json({ error: "Preço deve ser número válido" });
    }

    // Validação para id_cargo
    if (isNaN(id_cargo) || id_cargo === null || id_cargo === undefined) {
      return res.status(400).json({ error: "ID da cargo é obrigatório e deve ser um número válido" });
    }

    // Verifica se a funcionario existe
    const existingPersonResult = await query(
      "SELECT * FROM funcionario WHERE cpf = $1",
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: "Funcionario não encontrado" });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      salario: salario !== undefined ? salario : currentPerson.salario,
      id_cargo: id_cargo !== undefined ? id_cargo : currentPerson.id_cargo,
    };

    // Atualiza a funcionario
    const updateResult = await query(
      `UPDATE funcionario 
       SET salario = $1, id_cargo = $2 WHERE cpf = $3 RETURNING *`,
      [ updatedFields.salario, updatedFields.id_cargo, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar funcionario:", error);

    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.deletarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a funcionario existe
    const existingPersonResult = await query(
      "SELECT * FROM funcionario WHERE cpf = $1",
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: "Funcionario não encontrada" });
    }

    // Deleta a funcionario (as constraints CASCADE cuidarão das dependências)
    await query("DELETE FROM funcionario WHERE cpf = $1", [id]);

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar funcionario:", error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === "23503") {
      return res.status(400).json({
        error: "Não é possível deletar funcionario com dependências associadas",
      });
    }

    res.status(500).json({ error: "Erro interno do servidor" });
  }
};


// Função para obter funcionário por CPF da pessoa
exports.obterFuncionarioPorCpf = async (req, res) => {
  try {
    const cpf = req.params.cpf;

    if (!cpf) {
      return res.status(400).json({ error: "CPF é obrigatório" });
    }

    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.obterFuncionarioPorCpf(cpf);
    } else {
      result = await query(`
        SELECT 
          f.cpf,
          f.salario,
          f.id_cargo,
          c.nome_cargo
        FROM funcionario f
        INNER JOIN cargo c ON f.id_cargo = c.id_cargo
        WHERE f.cpf = $1
      `, [cpf]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao obter funcionário por CPF:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

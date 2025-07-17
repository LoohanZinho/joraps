# Como Fazer o Deploy do Projeto no GitHub

Este guia fornece um passo a passo simples para enviar seu projeto do Firebase Studio para um novo repositório no GitHub.

## Pré-requisitos

- Você precisa ter uma conta no [GitHub](https://github.com/).
- Você precisa ter o [Git](https://git-scm.com/downloads) instalado na sua máquina local.

---

### Passo 1: Criar um Novo Repositório no GitHub

1.  Acesse o [GitHub](https://github.com) e faça login na sua conta.
2.  No canto superior direito, clique no ícone de `+` e selecione **"New repository"**.
3.  Dê um nome ao seu repositório (por exemplo, `meu-app-de-transcricao`).
4.  Você pode adicionar uma descrição (opcional).
5.  Mantenha o repositório como **"Public"** (Público) ou **"Private"** (Privado), conforme sua preferência.
6.  Clique no botão **"Create repository"**.

Você será redirecionado para a página do seu novo repositório. Mantenha essa página aberta.

### Passo 2: Inicializar o Git e Fazer o Primeiro Commit

Agora, no seu ambiente de desenvolvimento (seu terminal ou linha de comando), execute os comandos um por um:

1.  **Inicialize o repositório Git:**
    ```bash
    git init
    ```

2.  **Adicione todos os arquivos para o "stage" (este passo é crucial):**
    ```bash
    git add .
    ```

3.  **Faça o primeiro "commit" (salve suas alterações):**
    ```bash
    git commit -m "Commit inicial do projeto de transcrição"
    ```

4.  **Defina o nome da branch principal como `main`:**
    ```bash
    git branch -M main
    ```

### Passo 3: Conectar seu Repositório Local ao GitHub

Volte para a página do seu repositório no GitHub. Você verá uma seção chamada **"...or push an existing repository from the command line"**. Copie o comando de lá. Ele será parecido com este:

```bash
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
```

**Importante:** Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub e `NOME_DO_REPOSITORIO` pelo nome que você deu ao seu repositório.

Cole e execute esse comando no seu terminal.

### Passo 4: Enviar (Push) seu Código para o GitHub

Finalmente, envie seu código para o repositório no GitHub:

```bash
git push -u origin main
```

O Git pode pedir suas credenciais do GitHub (usuário e senha ou um token de acesso pessoal).

---

**Pronto!** ✨

Se você atualizar a página do seu repositório no GitHub, verá todos os arquivos do seu projeto lá. Agora seu código está salvo e versionado.

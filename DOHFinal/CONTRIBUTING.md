# Como Fazer o Deploy do Projeto no GitHub

Este é um guia simplificado para enviar seu projeto para um novo repositório no GitHub.

---

### Passo 1: Criar um Repositório no GitHub

1.  Vá para [GitHub](https://github.com) e crie um **novo repositório**.
2.  Copie a URL do seu novo repositório. Ela será parecida com: `https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git`.

---

### Passo 2: Enviar seu Código (Execute no Terminal)

Execute os comandos abaixo, **um por um**, na ordem exata.

1.  **Inicialize o Git no seu projeto:**
    ```bash
    git init
    ```

2.  **Adicione todos os arquivos:**
    ```bash
    git add .
    ```

3.  **Faça o "commit" (salve suas alterações):**
    ```bash
    git commit -m "Commit inicial do projeto"
    ```

4.  **Defina a branch principal como `main`:**
    ```bash
    git branch -M main
    ```

5.  **Conecte seu projeto ao repositório do GitHub:**
    *Substitua a URL pela URL do seu repositório que você copiou no Passo 1.*
    ```bash
    git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
    ```

6.  **Envie (push) seu código:**
    ```bash
    git push -u origin main
    ```

---

**Pronto!** ✨

Seu código agora está no GitHub.

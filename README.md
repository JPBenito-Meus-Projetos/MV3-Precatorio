# MNPR Capital — Site Institucional

Site institucional da MNPR Capital com formulário de propostas de precatórios e envio automático por e-mail.

## Requisitos

- [Node.js](https://nodejs.org) LTS (v20+)
- Conta Microsoft 365 com SMTP habilitado

## Instalação

```bash
npm install
```

## Configuração

Copie `.env.example` para `.env` e preencha:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=seu_email@mv3.com.br
SMTP_PASS=sua_senha_ou_senha_de_app
SMTP_FROM=seu_email@mv3.com.br
PROPOSTA_DESTINO=destino@mv3.com.br
PORT=3000
```

> O arquivo `.env` **não** é enviado ao GitHub (está no `.gitignore`).

## Executar localmente

**Windows (PowerShell):**

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
node server/index.js
```

Ou dê dois cliques em `start.bat`.

Acesse: **http://localhost:3000**

> O formulário só funciona com o servidor rodando. Não abra o `index.html` diretamente.

## Produção

Defina `NODE_ENV=production` no servidor para mensagens de erro genéricas.

Recomendações:

- Hospedar em Render, Railway, VPS ou similar
- Usar HTTPS
- Manter `.env` apenas no servidor
- Habilitar SMTP AUTH na conta Microsoft 365

## Estrutura

```
├── index.html      # Página principal
├── styles.css      # Estilos
├── script.js       # Interações e formulário
├── server/
│   └── index.js    # API de envio de e-mail
├── IMG/            # Imagens do site
├── .env.example    # Modelo de variáveis
└── start.bat       # Atalho Windows
```

## Segurança

- Validação no front-end e back-end
- Campo honeypot anti-spam
- Rate limiting (5 envios por IP a cada 15 min)
- Sanitização HTML nos e-mails
- Credenciais em variáveis de ambiente

## Priorização interna

Cada proposta recebe uma pontuação com base em **perfil** e **valor** do precatório.
O resultado aparece no e-mail (assunto, badge e tabela) para triagem da equipe.

Critérios configuráveis em `server/prioridade.js`:

| Prioridade | Pontuação |
|------------|-----------|
| Alta | ≥ 50 pts |
| Média | ≥ 25 pts |
| Padrão | < 25 pts |

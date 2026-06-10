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
NODE_ENV=development

SITE_URL=https://www.seudominio.com.br
CONTACT_PHONE=(11) 99999-9999
CONTACT_EMAIL=contato@empresa.com.br
```

> O arquivo `.env` **não** é enviado ao GitHub (está no `.gitignore`).

## Executar localmente

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
node server/index.js
```

Ou dê dois cliques em `start.bat`.

Acesse: **http://localhost:3000**

> O formulário só funciona com o servidor rodando. Não abra o `index.html` diretamente.

## Produção

Defina no servidor:

```env
NODE_ENV=production
SITE_URL=https://www.seudominio.com.br
```

Recomendações:

- Hospedar em Render, Railway, VPS ou similar
- HTTPS com proxy reverso (redirecionamento automático em produção)
- Manter `.env` apenas no servidor
- Habilitar SMTP AUTH na conta Microsoft 365

## Estrutura

```
├── index.html          # Página principal
├── privacidade.html    # Política de Privacidade (LGPD)
├── styles.css          # Estilos
├── script.js           # Interações e formulário
├── server/
│   ├── index.js          # API, segurança e páginas dinâmicas
│   ├── pages.js          # Injeção de URL/contato, sitemap, robots
│   ├── email-proposta.js # Template HTML do e-mail
│   └── prioridade.js     # Pontuação interna
├── IMG/                # Imagens do site
├── .env.example
└── start.bat
```

## Boas práticas implementadas

### SEO
- Favicon, canonical, Open Graph e Twitter Card
- `robots.txt` e `sitemap.xml` dinâmicos
- `meta description` e `theme-color`

### Acessibilidade
- Skip link, landmarks, `aria-expanded`, `aria-live`
- `aria-invalid` e mensagens de erro por campo
- Menu mobile com foco e tecla Esc
- `prefers-reduced-motion`

### LGPD
- Política de Privacidade (`/privacidade.html`)
- Checkbox de consentimento obrigatório (front + back)

### Segurança
- Helmet + CSP
- Rate limiting, honeypot, validação dupla
- HTTPS forçado em produção
- Credenciais em `.env`
- Arquivos ocultos não servidos (`dotfiles: ignore`)

### Performance
- `loading="lazy"` em imagens
- Logo com `srcset` para telas Retina

## Priorização interna

Cada proposta recebe pontuação por **perfil** e **valor**. O resultado aparece no **assunto** do e-mail e nos cabeçalhos `X-MNPR-*`.

Critérios em `server/prioridade.js`:

| Prioridade | Pontuação |
|------------|-----------|
| Alta | ≥ 50 pts |
| Média | ≥ 25 pts |
| Baixa | < 25 pts |

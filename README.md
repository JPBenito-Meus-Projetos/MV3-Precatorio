# MNPR Capital — Site Institucional

Site institucional da MNPR Capital com formulário de propostas de precatórios e envio automático por e-mail.

## Requisitos

- [Node.js](https://nodejs.org) LTS (v20+)
- Conta de e-mail corporativo com SMTP (HostGator: `mail.seudominio.com.br`)

## Instalação

```bash
npm install
```

## Configuração

Copie `.env.example` para `.env` e preencha:

```env
SMTP_HOST=mail.mnprcapital.com.br
SMTP_PORT=587
SMTP_USER=contato@mnprcapital.com.br
SMTP_PASS=senha_do_email
SMTP_FROM=contato@mnprcapital.com.br
PROPOSTA_DESTINO=contato@mnprcapital.com.br
PROPOSTA_CC=marcelo.santos@mnprcapital.com.br,paulo.mota@mnprcapital.com.br,nilson.vieira@mnprcapital.com.br,renato.ungaretti@mnprcapital.com.br
PORT=3000
NODE_ENV=production

SITE_URL=https://www.mnprcapital.com.br
CONTACT_PHONE=(11) 99999-9999
CONTACT_EMAIL=contato@mnprcapital.com.br
```

> O arquivo `.env` **não** é enviado ao GitHub (está no `.gitignore`).

## Publicar na HostGator

1. Rode `npm run build` para gerar a pasta `dist/`.
2. Envie o conteúdo de `dist/` para o servidor (FTP ou Gerenciador de Arquivos).
3. Crie o arquivo `.env` **no servidor** com as mesmas variáveis acima.
4. No cPanel, configure uma **aplicação Node.js** apontando para `server/index.js`.
5. Execute `npm install` e inicie com `npm start`.

Defina no servidor:

```env
NODE_ENV=production
SITE_URL=https://www.mnprcapital.com.br
```

Recomendações:

- HTTPS ativo no domínio (redirecionamento automático em produção)
- Manter `.env` apenas no servidor
- O formulário exige o Node.js rodando — HTML estático sozinho não envia e-mail

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

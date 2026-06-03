# TeamZ Tools

Painel de controle para selfbot do Discord, construído com React, Vite, TypeScript e Tailwind CSS.

## Stack

- **React 19** — Interface de usuário
- **Vite 7** — Build e dev server
- **TypeScript 5.9** — Tipagem estática
- **Tailwind CSS 4** — Estilização

## Funcionalidades

- Autenticação via token do Discord
- Gerenciamento de múltiplas contas
- Ferramentas de moderação e automação:
  - Spam / Raid / Nuke
  - DM em massa
  - Webhook spammer
  - Clonador de servidor
  - Rich Presence (RPC) customizável
  - Alteração de status e nickname
- Log em tempo real de ações executadas

## Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
- npm

## Instalação

```bash
cd "TeamZ Tools"
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Inicia o servidor de desenvolvimento. Acesse `http://localhost:5173` no navegador.

## Build

```bash
npm run build
```

Gera os arquivos otimizados na pasta `dist/`.

## Preview do build

```bash
npm run preview
```

## Estrutura

```
TeamZ Tools/
├── src/
│   ├── App.tsx        # Componente principal e lógica do painel
│   ├── main.tsx       # Entrada da aplicação
│   ├── index.css      # Estilos base + Tailwind
│   └── utils/         # Utilitários (storage, etc.)
├── dist/              # Build de produção
├── index.html         # HTML base
├── vite.config.ts     # Configuração do Vite
├── tsconfig.json      # Configuração do TypeScript
└── package.json       # Dependências e scripts
```

## Aviso

Selfbots violam os [Termos de Serviço do Discord](https://discord.com/terms). O uso desta ferramenta pode resultar em banimento da conta. Use por sua conta e risco.

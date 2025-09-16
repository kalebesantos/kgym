# 🏋️ KGym - Sistema de Gestão para Academias

O **KGym** é um sistema completo de gestão desenvolvido especificamente para academias, oferecendo controle total sobre alunos, planos e acessos. O sistema permite que proprietários e administradores de academias gerenciem de forma eficiente todos os aspectos do negócio.

## 🎯 Funcionalidades Principais

### 📊 Dashboard
- **Visão geral completa** com métricas em tempo real
- **Estatísticas de alunos** (total, ativos, inativos)
- **Controle de planos** disponíveis e ativos
- **Monitoramento de check-ins** diários
- **Atividade recente** do sistema

### 👥 Gestão de Alunos
- **Cadastro completo** de alunos com dados pessoais
- **Sistema de busca** por nome, telefone ou CPF
- **Controle de status** (ativo, inativo, expirado, expirando)
- **Histórico de planos** e relacionamentos
- **Interface intuitiva** para gerenciamento

### 💳 Gestão de Planos
- **Criação e edição** de planos personalizados
- **Controle de preços** e durações flexíveis
- **Status ativo/inativo** para cada plano
- **Sistema de busca** e filtros
- **Cálculo automático** de vencimentos

### 🚪 Sistema de Check-in
- **Controle de acesso** via QR Code
- **Validação automática** de planos ativos
- **Verificação de vencimentos** em tempo real
- **Registro de frequência** detalhado
- **Interface de scanner** intuitiva

### 📈 Relatórios e Analytics
- **Receita mensal** baseada em planos ativos
- **Métricas de frequência** e check-ins
- **Distribuição de planos** por tipo
- **Indicadores de performance** do negócio
- **Análise de crescimento** de alunos

## 🛠️ Tecnologias e Ferramentas

### Frontend
- **React 18** - Biblioteca principal para interface
- **TypeScript** - Tipagem estática para maior confiabilidade
- **Vite** - Build tool moderno e rápido
- **React Router DOM** - Roteamento de páginas
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### UI/UX
- **shadcn/ui** - Componentes de interface modernos
- **Radix UI** - Primitivos acessíveis e customizáveis
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Ícones modernos e consistentes
- **Class Variance Authority** - Gerenciamento de variantes CSS

### Backend e Banco de Dados
- **Supabase** - Backend-as-a-Service completo
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança a nível de linha
- **Supabase Auth** - Sistema de autenticação
- **Supabase Realtime** - Atualizações em tempo real

### Estado e Cache
- **TanStack Query** - Gerenciamento de estado do servidor
- **React Context** - Estado global da aplicação
- **Local Storage** - Persistência local de dados

### Desenvolvimento
- **ESLint** - Linting de código
- **TypeScript ESLint** - Regras específicas para TypeScript
- **PostCSS** - Processamento de CSS
- **Autoprefixer** - Compatibilidade de CSS

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **`profiles`** - Perfis de usuários (admin/student)
- **`plans`** - Planos disponíveis da academia
- **`student_plans`** - Relacionamento entre alunos e planos
- **`check_ins`** - Registros de acesso à academia

### Segurança
- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas de acesso** baseadas em roles (admin/student)
- **Autenticação** via Supabase Auth
- **Validação** de dados no frontend e backend

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase

### Instalação

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd kgym

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env.local com:
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# 4. Execute as migrações do banco de dados
# No painel do Supabase, execute os arquivos SQL da pasta supabase/migrations/

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

### Scripts Disponíveis
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
```

## 📱 Interface e Experiência

### Design System
- **Design moderno** e responsivo
- **Gradientes personalizados** para elementos visuais
- **Animações suaves** e transições
- **Tema consistente** em toda a aplicação
- **Componentes reutilizáveis** e acessíveis

### Responsividade
- **Mobile-first** approach
- **Breakpoints** otimizados para diferentes dispositivos
- **Layout adaptativo** para tablets e desktops

## 🔐 Segurança e Controle de Acesso

### Sistema de Roles
- **Admin**: Acesso completo ao sistema
- **Student**: Acesso limitado aos próprios dados

### Validações
- **Frontend**: Validação em tempo real com Zod
- **Backend**: Políticas RLS no Supabase
- **Formulários**: Validação antes do envio

## 📊 Métricas e Relatórios

### Indicadores Disponíveis
- Receita mensal por planos ativos
- Número de check-ins por período
- Distribuição de alunos por plano
- Taxa de retenção de alunos
- Crescimento mensal de novos cadastros

## 🎨 Personalização

### Temas e Cores
- Sistema de cores personalizável
- Gradientes configuráveis
- Componentes com variantes de estilo

### Componentes
- Biblioteca completa de componentes UI
- Fácil customização via props
- Documentação integrada

## 📈 Roadmap Futuro

- [ ] Sistema de pagamentos integrado
- [ ] Notificações push para vencimentos
- [ ] App mobile nativo
- [ ] Integração com sistemas de pagamento
- [ ] Relatórios avançados com gráficos
- [ ] Sistema de mensalidades automáticas
- [ ] Controle de estoque de produtos
- [ ] Sistema de avaliações e feedback

## 🤝 Contribuição

Este é um projeto desenvolvido para academias, mas contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**KGym** - Transformando a gestão de academias com tecnologia moderna! 🏋️‍♂️💪

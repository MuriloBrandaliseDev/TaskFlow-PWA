# 📱 TaskFlow - Gerenciador de Tarefas Inteligente

Um aplicativo moderno e profissional para gerenciamento de tarefas, documentos e anotações, desenvolvido com React Native e Expo.

## ✨ Funcionalidades

### 🎯 Gerenciamento de Tarefas
- ✅ Criação e edição de tarefas
- 🏷️ Categorização por tipo (trabalho, pessoal, saúde, etc.)
- ⚡ Prioridades (baixa, média, alta, urgente)
- 📅 Prazos e lembretes
- 📋 Subtarefas
- 🏷️ Sistema de tags

### 📄 Gestão de Documentos
- 📎 Upload de documentos (PDF, imagens, documentos)
- 🔍 Preview de documentos
- 📝 Anotações vinculadas a documentos
- 🏷️ Organização por tags
- 💾 Armazenamento local seguro

### 📝 Sistema de Anotações
- ✍️ Anotações de texto
- ✅ Listas de verificação
- 🎤 Anotações de voz (em desenvolvimento)
- 📷 Anotações com imagens (em desenvolvimento)
- 🔗 Vinculação com tarefas e documentos

### 🎨 Interface Moderna
- 🌙 Modo escuro/claro automático
- 🎨 Design system consistente
- 📱 Interface responsiva
- ⚡ Animações suaves
- 🔍 Busca avançada

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app no seu dispositivo móvel

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone <seu-repositorio>
   cd TaskFlow
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

4. **Execute no dispositivo:**
   - Abra o Expo Go no seu iPhone/Android
   - Escaneie o QR code que aparece no terminal
   - O app será carregado no seu dispositivo

### Comandos Disponíveis

```bash
# Iniciar o servidor de desenvolvimento
npm start

# Executar no iOS (requer Mac)
npm run ios

# Executar no Android
npm run android

# Executar na web
npm run web

# Fazer build para produção
npm run build
```

## 📱 Testando no iPhone

### Opção 1: Expo Go (Recomendado para desenvolvimento)
1. Baixe o app "Expo Go" da App Store
2. Execute `npm start` no terminal
3. Escaneie o QR code com a câmera do iPhone
4. O app abrirá automaticamente no Expo Go

### Opção 2: TestFlight (Para distribuição)
1. Configure o projeto para build nativo
2. Faça upload para o App Store Connect
3. Adicione testadores via TestFlight
4. Distribua o link de teste

## 🏗️ Estrutura do Projeto

```
TaskFlow/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── constants/           # Constantes (cores, espaçamentos, etc.)
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── typography.ts
│   ├── contexts/            # Contextos React
│   │   └── ThemeContext.tsx
│   ├── navigation/          # Configuração de navegação
│   │   └── AppNavigator.tsx
│   ├── screens/             # Telas do aplicativo
│   │   ├── DashboardScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── DocumentsScreen.tsx
│   │   ├── NotesScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/            # Serviços e APIs
│   ├── types/               # Definições TypeScript
│   │   └── index.ts
│   └── utils/               # Funções utilitárias
├── App.tsx                  # Componente principal
├── app.json                 # Configuração do Expo
└── package.json
```

## 🎨 Design System

O app utiliza um design system consistente com:

- **Cores**: Paleta moderna com suporte a modo escuro
- **Tipografia**: Hierarquia clara de textos
- **Espaçamentos**: Sistema baseado em múltiplos de 4
- **Componentes**: Biblioteca de componentes reutilizáveis
- **Ícones**: Expo Vector Icons

## 🔧 Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma para desenvolvimento React Native
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação entre telas
- **Expo Vector Icons** - Ícones
- **AsyncStorage** - Armazenamento local
- **Expo Document Picker** - Seleção de documentos
- **Expo File System** - Gerenciamento de arquivos

## 📋 Próximas Funcionalidades

- [ ] Sincronização em nuvem
- [ ] Notificações push
- [ ] Colaboração em equipe
- [ ] Relatórios e analytics
- [ ] Integração com calendários
- [ ] Backup automático
- [ ] Modo offline completo

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões, por favor:

1. Abra uma issue no GitHub
2. Entre em contato via email
3. Consulte a documentação do Expo

---

**Desenvolvido com ❤️ para organizar sua vida de forma inteligente!**

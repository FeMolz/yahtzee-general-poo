# 🎲 Jogo General (Yahtzee) em JavaScript

Um jogo de dados clássico do estilo **General** (também conhecido internacionalmente como *Yahtzee*), executado diretamente no terminal e desenvolvido com **JavaScript moderno (Node.js ES Modules)** e **Programação Orientada a Objetos (POO)**.

---

## 🎯 Motivação do Projeto

Este projeto nasceu como um **desafio pessoal de estudos** com o objetivo de colocar em prática, exercitar e consolidar conceitos fundamentais da programação:

- **Programação Orientada a Objetos (POO):** Criação e comunicação entre classes (`Jogador`, `JogoGeneral`, `CategoriasCartela`), encapsulamento de estado interno e separação de responsabilidades.
- **JavaScript Moderno:** Modularização com ES Modules (`import`/`export`), assincronismo com `async`/`await` e manipulação de fluxos com `node:readline/promises`.
- **Lógica e Estrutura de Dados:** Algoritmos para rolagem e rerrolagem de dados mantendo escolhas do jogador, validação de jogadas e detecção automática de combinações na mesa.

---

## 🕹️ Como Jogar

1. O jogo suporta de **2 a 4 jogadores**.
2. Cada partida dura **12 rodadas** (uma para cada categoria da cartela de pontuação).
3. A cada rodada, cada jogador tem direito a até **3 lançamentos de dados**:
   - **1º Lançamento:** Todos os 5 dados são rolados.
   - **2º e 3º Lançamentos (opcionais):** O jogador pode escolher quais dados deseja manter e rerrolar apenas os restantes.
   - **Bônus de Mão:** Se o jogador decidir pontuar logo no primeiro lançamento sem rerrolar nenhum dado, os pontos daquela categoria são **dobrados**!
4. **Assistente de Combinações:** O sistema detecta automaticamente se os dados formam combinações especiais (Trinca, Quadra, Full Hand, Sequências ou General) que ainda estejam disponíveis na cartela, permitindo pontuar direto.
5. Ao término das 12 rodadas, o jogador com a maior pontuação total acumulada é consagrado o **vencedor**.

---

## 🚀 Como Executar o Jogo

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado na máquina (versão 18 ou superior).

### Passo a Passo

1. Abra o terminal na pasta do projeto:
```bash
cd study-general-minigame
```

2. Execute o jogo com o comando:
```bash
npm start
```
*(ou alternativamente via `node src/index.js`)*

3. Siga as instruções na tela digitando os nomes dos jogadores e fazendo as suas jogadas pelo teclado!

---

## 📁 Estrutura do Código

```text
src/
├── cli/
│   └── terminal.js          # Interface do usuário (CLI), entrada de dados e menus interativos
├── models/
│   ├── CategoriasCartela.js  # Regras e algoritmos de pontuação das 12 categorias
│   ├── Jogador.js            # Modelo de cada jogador (cartela, tentativas, bônus de mão)
│   └── JogoGeneral.js        # Gerenciamento de turnos, rodadas e determinação do vencedor
├── utils/
│   ├── helpers.js            # Sorteios aleatórios, rerrolagens e scanner de combinações
│   └── validators.js         # Validações de regex (nomes e opções de menu)
└── index.js                  # Ponto de entrada e Loop Principal da Partida (Game Loop)
```

---

Desenvolvido por **Felipe Molz** para fins de estudo e aprimoramento em JavaScript e POO.

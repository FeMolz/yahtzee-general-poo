import { configurarJogadores, jogarTurno } from './cli/terminal.js';
import { CategoriasCartela } from './models/CategoriasCartela.js';
import { Jogador } from './models/Jogador.js';
import { JogoGeneral } from './models/JogoGeneral.js';
import { randomPlayer } from './utils/helpers.js';
import * as readline from 'node:readline/promises';


async function iniciarJogo() {
    const rl = readline.createInterface({ input: process.stdin , output: process.stdout });

    console.log("--- BEM-VINDO AO JOGO GENERAL ---\n");
    
    const nomesDosJogadores = await configurarJogadores(rl);
    
    console.log("\nJogo iniciado com os seguintes jogadores:");
    console.log(nomesDosJogadores);

    const jogadores = nomesDosJogadores.map(nome => new Jogador(nome));
    const jogo = new JogoGeneral(jogadores);
    const jogadorInicial = randomPlayer(jogadores);
    jogo.iniciadorDePartida = jogadorInicial;
    jogadorInicial.jogando = true;
    console.log(`Primeiro a jogar é: ${jogadorInicial.nome}`);

    while (jogo.rodadaAtual <= jogo.maximoRodadas) {
        
        const jogadorAtivo = jogo.obterJogadorAtivo();
        await jogarTurno(jogadorAtivo, rl);
        jogo.passarTurno();
    }
    
    jogo.obterVencedor();
}

iniciarJogo();

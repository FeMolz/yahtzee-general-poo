import { configurarJogadores, jogarTurno } from './cli/terminal.js';
import { CategoriasCartela } from './models/CategoriasCartela.js';
import { Jogador } from './models/Jogador.js';
import { JogoGeneral } from './models/JogoGeneral.js';
import { randomPlayer } from './utils/helpers.js';
import * as readline from 'node:readline/promises';


async function iniciarJogo() {
    const rl = readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    });

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
        console.log(`\n========================================`);
        console.log(`   RODADA ${jogo.rodadaAtual} DE ${jogo.maximoRodadas}`);
        console.log(`========================================`);

        const jogadorAtivo = jogo.obterJogadorAtivo();
        await jogarTurno(jogadorAtivo, rl);
        jogo.passarTurno();
    }
    
    const vencedor = jogo.obterVencedor();
    console.log("\n=========================================");
    console.log("          🏆 FIM DE JOGO! 🏆            ");
    console.log("=========================================");
    console.log(`Parabéns, ${vencedor.nome.toUpperCase()}! Você venceu com ${vencedor.pontuacaoTotal} pontos!\n`);

    console.log("--- CLASSIFICAÇÃO GERAL ---");
    const ranking = [...jogo.jogadores].sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);
    ranking.forEach((jogador, index) => {
        console.log(`${index + 1}º Lugar: ${jogador.nome.toUpperCase()} - ${jogador.pontuacaoTotal} pontos`);
    });
    console.log("=========================================\n");

    rl.close();
}

iniciarJogo();

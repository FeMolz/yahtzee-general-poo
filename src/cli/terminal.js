import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { validarNome, validarOpcao } from '../utils/validators.js';
import { rerollDices, rollDices } from '../utils/helpers.js';
import { verificarCombinacoesEspeciais } from '../utils/helpers.js';

export async function configurarJogadores(rl) {
    let jogadores = [];
    
    while (jogadores.length < 4) {
        const nome = await rl.question('Digite o nome do jogador: ');
        const nomeFormatado = nome.trim().toLowerCase();

        if (!validarNome(nomeFormatado)) {
            console.log('Nome Inválido! Use apenas letras.\n');
            continue;
        }

        if (jogadores.includes(nomeFormatado)) {
            console.log(`O jogador ${nomeFormatado} já existe!\n`);
            continue;
        }   

        jogadores.push(nomeFormatado);
        console.log(`Jogador ${nomeFormatado} adicionado com sucesso!\n`);
        console.log(`Jogadores atuais:`, jogadores);

        if (jogadores.length >= 2 && jogadores.length < 4) {
            let opcao = "";
            let opcoesValidas = false;

            do {
                opcao = await rl.question('\nDigite: \n(1) para iniciar o jogo\n(2) para adicionar mais jogadores: ');
                opcoesValidas = validarOpcao(opcao);

                if (!opcoesValidas) {
                    console.log('Opção Inválida! Tente novamente.\n');
                }
            } while (!opcoesValidas);

            if (opcao === "1") {
                break;
            }
        }
    }
    
    return jogadores;
}

export async function jogarTurno(jogador, rl) {
    let dados = rollDices();
    jogador.decrementarLancamento();

    console.log(`\n--- Vez do jogador ${jogador.nome.toUpperCase()} ---`);
    console.log(`Lancamentos restantes: ${jogador.lancamentosRestantes}`);
    console.log(`Dados na mesa:\n [ ${dados.join(', ')} ]\n`);
    exibirSugestoes(dados, jogador)

    while (jogador.podeJogar()) {

        let querRolar = "";
        let opcaoValida = false;
        
        do {
            querRolar = await rl.question('Deseja rolar os dados novamente?\n Sim : (1)\n Não : (2) ');
            opcaoValida = validarOpcao(querRolar);

            if (!opcaoValida) {
                console.log('Opção Inválida! Tente novamente.\n');
            }
        } while (!opcaoValida);

        if (querRolar === '2') {
            break;
        }
        
        const respostaManter = await rl.question('\nDigite os dados que deseja MANTER separados pro espaço (ou ENTER para rolar todos): ');

        const dadosManter = respostaManter.trim() !== ""
            ? respostaManter.trim().split(/\s+/).map(Number)
            : [];
        
        const resultado = rerollDices(dados, dadosManter);
        dados = resultado.mesaFinal;
        jogador.decrementarLancamento();

        console.log(`\nLançamentos restantes: ${jogador.lancamentosRestantes}`);
        console.log(`Novos dados na mesa: [ ${dados.join(', ')} ]\n`);
        exibirSugestoes(dados, jogador);
    }

    console.log(`\n Dados finais do seu turno: [ ${dados.join(', ')} ]`);
    
    const categorias = Object.keys(jogador.cartela);
    console.log(`\n--- CARTELA DE ${jogador.nome.toUpperCase()} ---`);

    categorias.forEach((cat, index) => {
        const valor = jogador.cartela[cat];
        const status = valor != null ? `${valor} pts (usado)` : '[ DISPONÍVEL ]';
        console.log(`${index + 1} - ${cat}: ${status}`);
    });

    let preencheuComSucesso = false;

    do {
        const resposta = await rl.question(`\nEscolha o número da categoria para pontuar (1 a 12): `);
        const indice = parseInt(resposta) - 1;

        if (isNaN(indice) || indice < 0 || indice >= categorias.length) {
            console.log('Opção inválida! Digite um número de 1 a 12');
            continue;
        }

        const categoriaEscolhida = categorias[indice];

        preencheuComSucesso = jogador.preencherCartela(categoriaEscolhida, dados);

        if (!preencheuComSucesso) {
            console.log(`A categoria "${categoriaEscolhida}" já foi preenchida! Escolha outra.`);
        } else {
            const pontosGanhos = jogador.cartela[categoriaEscolhida];
            console.log(`\nVocê marcou ${pontosGanhos} pontos em "${categoriaEscolhida}".`);
        }
    } while (!preencheuComSucesso);

    jogador.resetarTentativas();
}

function exibirSugestoes(dados, jogador) {
    const sugestoes = verificarCombinacoesEspeciais(dados, jogador.cartela);
        
    if (sugestoes.length > 0) {
        sugestoes.forEach((item) => {
            console.log(`${item.categoria.toUpperCase()} vale ${item.pontos} pts! Digite ${item.numeroNoMenu} para pontuar!`);
        });
    }
}
import { CategoriasCartela } from '../models/CategoriasCartela.js';

export function rollDices() {
    let dices = [];

    for (let i = 0; i < 5; i++) {
        const random = Math.floor(Math.random() * 6 + 1);
        dices.push(random);
    }

    return dices;
}

export const randomPlayer = (jogadores) => {
    const random = Math.floor(Math.random() * jogadores.length);
    return jogadores[random];
}

export function rerollDices(dadosAtuais, dadosManter) {
    const contagemManter = {};
    for (const num of dadosManter) {
        contagemManter[num] = (contagemManter[num] || 0) + 1;
    }
    
    const mantidos = dadosAtuais.filter(num => {
        if (contagemManter[num] > 0) {
            contagemManter[num]--;
            return true;
        }
    });

    const quantidadeParaRolar = dadosAtuais.length - mantidos.length;

    const novosDados = rodarApenas(quantidadeParaRolar);

    return {
        mantidos,
        novosDados,
        mesaFinal: [...mantidos, ...novosDados]
    };
}

const rodarApenas = (quantidade) => {
    let newDices = [];

    for (let i = 0; i < quantidade; i++) {
        const random = Math.floor(Math.random() * 6 + 1);
        newDices.push(random);
    }

    return newDices;
}

export function verificarCombinacoesEspeciais(dados, cartela) {
    let regras = new CategoriasCartela();
    const todasCategorias = Object.keys(cartela);
    
    const especiais = ['trinca', 'quadraEspecial', 'fullHand', 'seqMenor', 'seqMaior', 'general'];

    const encontradas = [];

    for (const categoria of especiais) {
        const capitalize = categoria.charAt(0).toUpperCase();
        const restoDaPalavra = categoria.slice(1);
        const nomeDoMetodo = 'calcular' + capitalize + restoDaPalavra;

        const pontos = regras[nomeDoMetodo](dados);
        const numeroNoMenu = todasCategorias.indexOf(categoria) + 1

        if (pontos > 0 && cartela[categoria] === null) {
            encontradas.push({ categoria, pontos, numeroNoMenu })
        }
    }
    return encontradas;
}

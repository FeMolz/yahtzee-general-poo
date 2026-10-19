import { CategoriasCartela } from "./CategoriasCartela.js";

export class Jogador {
    constructor(nome) {
        this.nome = nome;
        this.jogando = false;
        this.pontuacaoTotal = 0;
        this.lancamentosRestantes = 3;
        this.cartela = {
            as: null,
            duque: null,
            terno: null,
            quadra: null,
            quina: null,
            sena: null,
            trinca: null,
            quadraEspecial: null,
            fullHand: null,
            seqMaior: null,
            seqMenor: null,
            general: null
        };
    }

    podeJogar() {
        return this.lancamentosRestantes > 0;
    }

    decrementarLancamento() {
        if (this.podeJogar()) {
            this.lancamentosRestantes--;
            return true;
        }
        return false;
    }

    resetarTentativas() {
        this.lancamentosRestantes = 3;
    }

    calcularPontuacaoDeMao(pontosBase) {
        const foiDeMao = this.lancamentosRestantes === 2 && pontosBase > 0;

        if (foiDeMao) {
            return pontosBase * 2;
        }

        return pontosBase;
    }

    preencherCartela(categoriaEscolhida, resultadoDados){
        if (this.cartela[categoriaEscolhida] !== null) {
            return false;
        }

        const capitalize = categoriaEscolhida.charAt(0).toUpperCase();
        const restoDaPalavra = categoriaEscolhida.slice(1);
        const nomeDoMetodo = 'calcular' + capitalize + restoDaPalavra;

        const regras = new CategoriasCartela();
        const pontosBase = regras[nomeDoMetodo](resultadoDados);
        const pontosFinais = this.calcularPontuacaoDeMao(pontosBase);

        this.cartela[categoriaEscolhida] = pontosFinais;
        this.pontuacaoTotal += pontosFinais;

        return true;
    }
}
export class CategoriasCartela {
    #somarNumero(dados, valor) {
        return dados
            .filter(dado => dado === valor)
            .reduce((acc, curr) => acc + curr, 0);
    }

    #contagemPorNumero(dados) {
        return dados.reduce((contagem, valor) => {
            contagem[valor] = (contagem[valor] || 0) + 1;
            return contagem;
        }, {});
    }

    #possuiSequencia(dados, sequencia) {
        const numerosUnicos = [...new Set(dados)].sort((a, b) => a - b);
        return sequencia.every(numero => numerosUnicos.includes(numero));
    }

    calcularAs(dados) {
        return this.#somarNumero(dados, 1);
    }

    calcularDuque(dados) {
        return this.#somarNumero(dados, 2);
    }

    calcularTerno(dados) {
        return this.#somarNumero(dados, 3);
    }

    calcularQuadra(dados) {
        return this.#somarNumero(dados, 4);
    }

    calcularQuina(dados) {
        return this.#somarNumero(dados, 5);
    }

    calcularSena(dados) {
        return this.#somarNumero(dados, 6);
    }

    calcularTrinca(dados) {
        const contagem = Object.values(this.#contagemPorNumero(dados));
        return contagem.some(quantidade => quantidade >= 3)
            ? dados.reduce((total, valor) => total + valor, 0)
            : 0;
    }

    calcularQuadraEspecial(dados) {
        const contagem = Object.values(this.#contagemPorNumero(dados));
        return contagem.some(quantidade => quantidade >= 4)
            ? dados.reduce((total, valor) => total + valor, 0)
            : 0;
    }

    calcularFullHand(dados) {
        const contagem = Object.values(this.#contagemPorNumero(dados));
        const temTrinca = contagem.includes(3);
        const temPar = contagem.includes(2);
        return temTrinca && temPar ? 25 : 0;
    }

    calcularSeqMenor(dados) {
        const sequencias = [
            [1, 2, 3, 4],
            [2, 3, 4, 5],
            [3, 4, 5, 6],
        ];

        return sequencias.some(sequencia => this.#possuiSequencia(dados, sequencia)) ? 30 : 0;
    }

    calcularSeqMaior(dados) {
        const sequencias = [
            [1, 2, 3, 4, 5],
            [2, 3, 4, 5, 6],
        ];

        return sequencias.some(sequencia => this.#possuiSequencia(dados, sequencia)) ? 40 : 0;
    }

    calcularSequencia(dados) {
        return this.calcularSeqMaior(dados) || this.calcularSeqMenor(dados);
    }

    calcularGeneral(dados) {
        const contagem = Object.values(this.#contagemPorNumero(dados));
        return contagem.includes(5) ? 50 : 0;
    }
}
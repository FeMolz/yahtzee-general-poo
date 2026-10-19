export class JogoGeneral {
    constructor(jogadores) {
        this.jogadores = jogadores;
        this.rodadaAtual = 1;
        this.maximoRodadas = 12;
        this.iniciadorDePartida = null;
    }
    
    obterJogadorAtivo() {
        let jogadorAtivo = this.jogadores.find(jogador => jogador.jogando === true);
        return jogadorAtivo;
    }

    passarTurno() {
        let jogadorAtual = this.obterJogadorAtivo();
        jogadorAtual.jogando = false;

        let indiceDoJogador = this.jogadores.indexOf(jogadorAtual);
        const ultimoJogador = indiceDoJogador === this.jogadores.length - 1;

        let proximoJogador;

        if (ultimoJogador) {
            proximoJogador = this.jogadores[0];
        } else {
            proximoJogador = this.jogadores[indiceDoJogador + 1];
        }

        if (proximoJogador === this.iniciadorDePartida) {
            this.rodadaAtual += 1;
        }
        
        proximoJogador.jogando = true;
    }

    obterVencedor() {
        let vencedor = this.jogadores[0];
        for (const e of this.jogadores) {
            if (e.pontuacaoTotal > vencedor.pontuacaoTotal) {
                vencedor = e;
            }
        }
        return vencedor;
    }
}
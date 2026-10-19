export function validarNome(nome) {
    const apenasLetras = /^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ ]+$/;
    return apenasLetras.test(nome);
}

export function validarOpcao(opcao) {
    const apenasUmEDois = /^[12]$/;
    return apenasUmEDois.test(opcao);
}


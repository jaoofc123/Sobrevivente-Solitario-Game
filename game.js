document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos Elementos HTML ---
    const vidaBar = document.getElementById('vida-bar');
    const vidaValor = document.getElementById('vida-valor');
    const energiaBar = document.getElementById('energia-bar');
    const energiaValor = document.getElementById('energia-valor');
    const comidaStat = document.getElementById('comida-stat');
    const madeiraStat = document.getElementById('madeira-stat');
    const baseStat = document.getElementById('base-stat');
    const diaStatus = document.getElementById('dia-status');
    const logArea = document.getElementById('log-area');

    const btnCacar = document.getElementById('btn-cacar');
    const btnMadeira = document.getElementById('btn-madeira');
    const btnDescansar = document.getElementById('btn-descansar');
    const btnComer = document.getElementById('btn-comer');
    const btnBase = document.getElementById('btn-base');

    // --- Variáveis de Estado do Jogo ---
    let vida = 100;
    let energia = 100;
    let comida = 3;
    let madeira = 0;
    let nivelBase = 0;
    let dia = 1;
    const diasObjetivo = 100;
    let jogoAtivo = true;

    // --- Funções de Ação (Que passam o dia) ---

    function cacar() {
        const custoEnergia = 20;
        if (energia < custoEnergia) {
            adicionarLog("Você está cansado demais para caçar.", "log-evento");
            return;
        }

        energia -= custoEnergia;
        adicionarLog("Você gasta o dia caçando...", "log-normal");

        setTimeout(() => {
            const sucessoCaca = Math.floor(Math.random() * 4); // 0 a 3
            if (sucessoCaca > 0) {
                comida += sucessoCaca;
                adicionarLog(`BOA! Você conseguiu ${sucessoCaca} porções de comida.`, "log-bom");
            } else {
                adicionarLog("DROGA! Você não encontrou nada.", "log-ruim");
            }
            proximoTurno(); // Avança para o fim do dia
        }, 500);
    }

    function coletarMadeira() {
        const custoEnergia = 15;
        if (energia < custoEnergia) {
            adicionarLog("Você está cansado demais para coletar madeira.", "log-evento");
            return;
        }

        energia -= custoEnergia;
        adicionarLog("Você passa o dia cortando madeira...", "log-normal");

        setTimeout(() => {
            const ganhoMadeira = Math.floor(Math.random() * 3) + 1; // 1 a 3
            madeira += ganhoMadeira;
            adicionarLog(`Você coletou ${ganhoMadeira} de madeira.`, "log-bom");
            proximoTurno();
        }, 500);
    }

    function descansar() {
        const custoEnergia = 5;
        if (energia < custoEnergia) {
            adicionarLog("Você precisa de um mínimo de 5 de energia para descansar.", "log-evento");
            return;
        }
        
        energia -= custoEnergia;
        let vidaRecuperada = Math.floor(Math.random() * 21) + 15; // 15 a 35
        vida += vidaRecuperada;
        if (vida > 100) vida = 100;
        
        adicionarLog(`Você passou o dia descansando e recuperou ${vidaRecuperada} de vida.`, "log-bom");
        proximoTurno();
    }

    // --- Funções de Ação (Grátis - Não passam o dia) ---

    function comer() {
        if (!jogoAtivo) return;

        if (comida > 0) {
            comida--;
            let energiaRecuperada = Math.floor(Math.random() * 21) + 40; // 40 a 60
            energia += energiaRecuperada;
            if (energia > 100) energia = 100;
            
            adicionarLog(`Você comeu e recuperou ${energiaRecuperada} de energia.`, "log-bom");
            atualizarStatus(); // Atualiza imediatamente
        } else {
            adicionarLog("Você não tem comida no inventário!", "log-ruim");
        }
    }

    function melhorarBase() {
        if (!jogoAtivo) return;

        const custoBase = (nivelBase + 1) * 10;
        if (madeira >= custoBase) {
            madeira -= custoBase;
            nivelBase++;
            adicionarLog(`VOCÊ MELHOROU SUA BASE! (Nível ${nivelBase})`, "log-bom");
            atualizarStatus(); // Atualiza imediatamente
        } else {
            adicionarLog(`Você precisa de ${custoBase} de madeira para melhorar a base.`, "log-ruim");
        }
    }

    // --- Lógica de Turnos e Eventos ---

    function proximoTurno() {
        if (!jogoAtivo) return;

        // 1. Metabolismo (Passagem do tempo)
        // A base torna a noite mais fácil!
        let gastoMetabolismo = 15 - (nivelBase * 2); // Nv1 gasta 13, Nv2 gasta 11...
        if (gastoMetabolismo < 5) gastoMetabolismo = 5; // Gasto mínimo
        
        energia -= gastoMetabolismo;
        if (nivelBase > 0) {
            adicionarLog(`Seu abrigo (Nv.${nivelBase}) te protegeu do frio. Você economizou energia.`, "log-bom");
        }

        // 2. Verificar Fome/Exaustão
        if (energia <= 0) {
            energia = 0;
            adicionarLog("Você está exausto e faminto! Sua vida está diminuindo.", "log-ruim");
            vida -= 10;
        }

        // 3. Eventos Aleatórios (Aqui está a melhoria!)
        eventoAleatorio();

        // 4. Verificar Morte
        if (vida <= 0) {
            vida = 0;
            gameOver();
            return;
        }

        // 5. Avançar o Dia
        dia++;
        if (dia > diasObjetivo) {
            gameWin();
            return;
        }

        atualizarStatus();
    }

    function eventoAleatorio() {
        const chance = Math.random();
        
        // A base (Nível 2+) oferece proteção contra eventos
        if (nivelBase >= 2) {
            let chanceProtecao = (nivelBase - 1) * 0.25; // Nv2=25%, Nv3=50%...
            if (Math.random() < chanceProtecao) {
                adicionarLog("Uma tempestade se formou, mas sua base (Nv." + nivelBase + ") protegeu você.", "log-bom");
                return; // O evento ruim é evitado
            }
        }

        // Escala de dificuldade dos eventos
        if (dia > 5 && chance < 0.15) { // 15% Ataque
            adicionarLog("[EVENTO] Um animal selvagem te ataca durante a noite!", "log-evento");
            let dano = Math.floor(Math.random() * 20) + 10; // 10-29 dano
            vida -= dano;
            adicionarLog(`Você foi ferido e perdeu ${dano} de vida.`, "log-ruim");
        } else if (chance < 0.30) { // 15% Tempestade (cansaço)
            adicionarLog("[EVENTO] Uma tempestade terrível! Você acorda cansado.", "log-evento");
            energia -= 20;
            adicionarLog("Você perdeu 20 de energia extra.", "log-ruim");
        } else if (dia > 10 && chance < 0.40 && nivelBase > 0) { // 10% Dano na base
            adicionarLog("[EVENTO] Ventos fortes danificaram seu abrigo!", "log-evento");
            nivelBase--;
            adicionarLog("Sua base foi rebaixada para o Nível " + nivelBase, "log-ruim");
        } else if (dia > 30 && chance < 0.45 && nivelBase > 2) { // 5% Desastre na base
            adicionarLog("[DESASTRE] Uma árvore caiu sobre seu abrigo!", "log-evento");
            nivelBase = 1; // Destrói a base, mas não totalmente
            adicionarLog("Sua base foi quase destruída! (Nível 1)", "log-ruim");
        } else if (chance > 0.9) { // 10% Sorte
            adicionarLog("[SORTE] Você encontrou um baú naufragado!", "log-bom");
            comida += 3;
            madeira += 5;
        }

        // Garante que os status não passem de 100 ou fiquem abaixo de 0
        if (vida > 100) vida = 100;
        if (energia > 100) energia = 100;
        if (energia < 0) energia = 0;
        if (vida < 0) vida = 0;
    }

    // --- Funções de Utilidade ---

    function adicionarLog(mensagem, tipo = "log-normal") {
        const logEntry = document.createElement('p');
        logEntry.textContent = mensagem;
        logEntry.className = tipo;
        logArea.prepend(logEntry);
    }

    function atualizarStatus() {
        // Barras
        vidaBar.value = vida;
        energiaBar.value = energia;

        // Texto
        vidaValor.textContent = `${vida}/100`;
        energiaValor.textContent = `${energia}/100`;
        comidaStat.textContent = comida;
        madeiraStat.textContent = madeira;
        
        // Lógica da Base
        let nomeBase = "Nenhuma (Nv. 0)";
        if (nivelBase === 1) nomeBase = "Cabana Fraca (Nv. 1)";
        else if (nivelBase === 2) nomeBase = "Abrigo (Nv. 2)";
        else if (nivelBase === 3) nomeBase = "Reforçada (Nv. 3)";
        else if (nivelBase >= 4) nomeBase = `Fortaleza (Nv. ${nivelBase})`;
        baseStat.textContent = nomeBase;

        // Atualiza custo do botão da base
        btnBase.textContent = `Melhorar Base (Custa ${(nivelBase + 1) * 10} Madeira)`;

        // Atualiza status do dia
        diaStatus.textContent = `Dia ${dia} de ${diasObjetivo}`;
    }

    function desativarBotoes() {
        jogoAtivo = false;
        btnCacar.disabled = true;
        btnDescansar.disabled = true;
        btnComer.disabled = true;
        btnMadeira.disabled = true;
        btnBase.disabled = true;
    }

    function gameOver() {
        desativarBotoes();
        adicionarLog("VOCÊ NÃO SOBREVIVEU...", "log-morte");
        diaStatus.textContent = `Você morreu no Dia ${dia}.`;
        atualizarStatus();
    }

    function gameWin() {
        desativarBotoes();
        adicionarLog("PARABÉNS! VOCÊ SOBREVIVEU AOS 100 DIAS!", "log-vitoria");
        diaStatus.textContent = `Você completou o desafio!`;
        atualizarStatus();
    }

    // --- Inicialização do Jogo ---
    atualizarStatus();
    
    // Conecta as ações aos botões
    btnCacar.addEventListener('click', cacar);
    btnMadeira.addEventListener('click', coletarMadeira);
    btnDescansar.addEventListener('click', descansar);
    btnComer.addEventListener('click', comer);
    btnBase.addEventListener('click', melhorarBase);
});

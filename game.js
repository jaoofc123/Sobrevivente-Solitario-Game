// Aguarda o HTML carregar antes de rodar o jogo
document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos Elementos HTML ---
    const vidaBar = document.getElementById('vida-bar');
    const vidaValor = document.getElementById('vida-valor');
    const energiaBar = document.getElementById('energia-bar');
    const energiaValor = document.getElementById('energia-valor');
    const comidaStat = document.getElementById('comida-stat');
    const diaStatus = document.getElementById('dia-status');
    const logArea = document.getElementById('log-area');

    const btnCacar = document.getElementById('btn-cacar');
    const btnDescansar = document.getElementById('btn-descansar');
    const btnComer = document.getElementById('btn-comer');

    // --- Variáveis de Estado do Jogo ---
    let vida = 100;
    let energia = 100;
    let comida = 3;
    let dia = 1;
    const diasObjetivo = 7;
    let jogoAtivo = true;

    // --- Funções Principais de Ação ---

    function cacar() {
        if (!jogoAtivo) return;

        const custoEnergia = 20;
        if (energia >= custoEnergia) {
            energia -= custoEnergia;
            adicionarLog("Você gasta energia caçando...", "log-normal");
            
            // Simula o sucesso da caça
            setTimeout(() => {
                const sucessoCaca = Math.floor(Math.random() * 4); // 0 a 3
                if (sucessoCaca > 0) {
                    comida += sucessoCaca;
                    adicionarLog(`BOA! Você conseguiu ${sucessoCaca} porções de comida.`, "log-bom");
                } else {
                    adicionarLog("DROGA! Você não encontrou nada.", "log-ruim");
                }
                proximoTurno(); // Avança para o fim do dia
            }, 1000); // A caça leva 1 segundo
        } else {
            adicionarLog("Você está cansado demais para caçar.", "log-evento");
        }
    }

    function descansar() {
        if (!jogoAtivo) return;

        const custoEnergia = 5;
        if (energia >= custoEnergia) {
            energia -= custoEnergia;
            let vidaRecuperada = Math.floor(Math.random() * 21) + 10; // 10 a 30
            vida += vidaRecuperada;
            if (vida > 100) vida = 100;
            
            adicionarLog(`Você descansou e recuperou ${vidaRecuperada} de vida.`, "log-bom");
            proximoTurno();
        } else {
            adicionarLog("Você precisa de um mínimo de 5 de energia para descansar.", "log-evento");
        }
    }

    function comer() {
        if (!jogoAtivo) return;

        if (comida > 0) {
            comida--;
            let energiaRecuperada = Math.floor(Math.random() * 21) + 40; // 40 a 60
            energia += energiaRecuperada;
            if (energia > 100) energia = 100;
            
            adicionarLog(`Você comeu e recuperou ${energiaRecuperada} de energia.`, "log-bom");
            proximoTurno();
        } else {
            adicionarLog("Você não tem comida no inventário!", "log-ruim");
        }
    }

    // --- Lógica de Turnos e Eventos ---

    function proximoTurno() {
        if (!jogoAtivo) return;

        // 1. Metabolismo (Passagem do tempo)
        energia -= 15; // Gasto base por noite

        // 2. Verificar Fome/Exaustão
        if (energia <= 0) {
            energia = 0; // Não pode ficar negativo
            adicionarLog("Você está exausto e faminto! Sua vida está diminuindo.", "log-ruim");
            vida -= 10;
        }

        // 3. Eventos Aleatórios (Aqui está a melhoria!)
        eventoAleatorio();

        // 4. Verificar Morte
        if (vida <= 0) {
            vida = 0;
            gameOver();
            return; // Para o jogo
        }

        // 5. Avançar o Dia
        dia++;
        if (dia > diasObjetivo) {
            gameWin();
            return;
        }

        // Atualiza a interface
        atualizarStatus();
    }

    function eventoAleatorio() {
        const chance = Math.random(); // Um número entre 0.0 e 1.0

        if (chance < 0.15) { // 15% chance
            adicionarLog("[EVENTO] Um lobo te ataca durante a noite!", "log-evento");
            let dano = Math.floor(Math.random() * 20) + 10; // 10-29 dano
            vida -= dano;
            adicionarLog(`Você foi ferido e perdeu ${dano} de vida.`, "log-ruim");
        } else if (chance < 0.30) { // 15% chance
            adicionarLog("[EVENTO] Uma tempestade terrível! Você não dormiu bem.", "log-evento");
            energia -= 20;
            adicionarLog("Você perdeu 20 de energia extra.", "log-ruim");
        } else if (chance < 0.40) { // 10% chance
            adicionarLog("[EVENTO] Você foi picado por uma cobra venenosa!", "log-evento");
            vida -= 30;
            adicionarLog("Você perdeu 30 de vida!", "log-ruim");
        } else if (chance < 0.55) { // 15% chance
            adicionarLog("[EVENTO] Você encontrou uma fonte de água fresca!", "log-bom");
            vida += 10;
            energia += 10;
        } else if (chance < 0.65) { // 10% chance
            adicionarLog("[EVENTO] Você encontrou frutas silvestres!", "log-bom");
            comida += 1;
        }
        // Se nada acontecer (35% de chance), é uma noite tranquila.

        // Garante que os status não passem de 100
        if (vida > 100) vida = 100;
        if (energia > 100) energia = 100;
    }

    // --- Funções de Utilidade ---

    function adicionarLog(mensagem, tipo = "log-normal") {
        const logEntry = document.createElement('p');
        logEntry.textContent = mensagem;
        logEntry.className = tipo; // Adiciona a classe CSS
        
        // Adiciona a nova mensagem no topo da lista
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
        diaStatus.textContent = `Dia ${dia} de ${diasObjetivo}`;
    }

    function desativarBotoes() {
        jogoAtivo = false;
        btnCacar.disabled = true;
        btnDescansar.disabled = true;
        btnComer.disabled = true;
    }

    function gameOver() {
        desativarBotoes();
        adicionarLog("VOCÊ NÃO SOBREVIVEU...", "log-morte");
        diaStatus.textContent = `Você morreu no Dia ${dia}.`;
        atualizarStatus();
    }

    function gameWin() {
        desativarBotoes();
        adicionarLog("PARABÉNS! VOCÊ SOBREVIVEU!", "log-vitoria");
        diaStatus.textContent = `Você sobreviveu aos ${diasObjetivo} dias!`;
        atualizarStatus();
    }

    // --- Inicialização do Jogo ---
    atualizarStatus(); // Define os valores iniciais na tela
    
    // Conecta as ações aos botões
    btnCacar.addEventListener('click', cacar);
    btnDescansar.addEventListener('click', descansar);
    btnComer.addEventListener('click', comer);
});

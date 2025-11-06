// O listener DOMContentLoaded agora configura o MENU
document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos Elementos do MENU ---
    const menuContainer = document.getElementById('menu-container');
    const gameContainer = document.getElementById('game-container');
    
    const btnTreinamento = document.getElementById('btn-treinamento');
    const btnFacil = document.getElementById('btn-facil');
    const btnMedio = document.getElementById('btn-medio');
    const btnDificil = document.getElementById('btn-dificil');

    // --- Referências aos Elementos do JOGO ---
    const carneStat = document.getElementById('carne-stat');
    const madeiraStat = document.getElementById('madeira-stat');
    const baseStat = document.getElementById('base-stat');
    const vidaBar = document.getElementById('vida-bar');
    const vidaValor = document.getElementById('vida-valor');
    const energiaBar = document.getElementById('energia-bar');
    const energiaValor = document.getElementById('energia-valor');
    const diaStatus = document.getElementById('dia-status');
    const logArea = document.getElementById('log-area');
    const acdStat = document.getElementById('acd-stat');
    const modoJogoTitulo = document.getElementById('modo-jogo-titulo'); // Novo

    const btnCacar = document.getElementById('btn-cacar');
    const btnMadeira = document.getElementById('btn-madeira');
    const btnDescansar = document.getElementById('btn-descansar');
    const btnComer = document.getElementById('btn-comer');
    const btnBase = document.getElementById('btn-base');

    // --- Referências aos Pop-ups ---
    const minigameOverlay = document.getElementById('minigame-overlay');
    const minigameArena = document.getElementById('minigame-arena');
    const minigameAlvo = document.getElementById('minigame-alvo');
    const minigameTimerSpan = document.querySelector('#minigame-timer span');
    
    const alertaOverlay = document.getElementById('alerta-overlay');
    const alertaTitulo = document.getElementById('alerta-titulo');
    const alertaMensagem = document.getElementById('alerta-mensagem');
    const alertaOk = document.getElementById('alerta-ok');

    const vitoriaOverlay = document.getElementById('vitoria-overlay');
    const vitoriaTitulo = document.getElementById('vitoria-titulo'); // Novo
    const vitoriaTextoDias = document.getElementById('vitoria-texto-dias'); // Novo

    // --- Variáveis de Estado do Jogo (Globais, mas definidas no início) ---
    let vida, energia, carne, madeira, nivelBase, dia, diasObjetivo;
    let pontosAcaoAtuais, cacasConsecutivas, coletasConsecutivas;
    let jogoAtivo, acaoEmProgresso;
    
    const PONTOS_ACAO_POR_DIA = 4;

    // ==========================================================
    // ===== NOVO: FUNÇÃO DE INÍCIO DE JOGO =====
    // ==========================================================
    function iniciarJogo(objetivo, modoTexto) {
        // 1. Esconde o menu e mostra o jogo
        menuContainer.style.display = 'none';
        gameContainer.style.display = 'block';

        // 2. Define as variáveis de estado iniciais
        vida = 100;
        energia = 100;
        carne = 3;
        madeira = 0;
        nivelBase = 0;
        dia = 1;
        diasObjetivo = objetivo;
        pontosAcaoAtuais = PONTOS_ACAO_POR_DIA;
        cacasConsecutivas = 0;
        coletasConsecutivas = 0;
        jogoAtivo = true;
        acaoEmProgresso = false;

        // 3. Configura a UI do jogo
        modoJogoTitulo.textContent = modoTexto;
        adicionarLog(`Começa o modo ${modoTexto}. Seu objetivo: sobreviver ${diasObjetivo} dias.`, "log-evento");

        // 4. Conecta os botões de ação (só precisa fazer isso uma vez)
        // (Eles já estão conectados lá embaixo, no fim do script)

        // 5. Atualiza a tela pela primeira vez
        atualizarStatus();
    }
    // ==========================================================
    // ===== FIM DA FUNÇÃO DE INÍCIO =====
    // ==========================================================


    // --- Função Mestra de Ação ---
    async function realizarAcao(custoAcd, fnSucesso) {
        if (!jogoAtivo || acaoEmProgresso) return;

        acaoEmProgresso = true;
        pontosAcaoAtuais -= custoAcd;
        atualizarStatus(); 

        await new Promise(r => setTimeout(r, 500)); 
        
        fnSucesso(); 

        if (pontosAcaoAtuais <= 0) {
            let dividaAcao = Math.abs(pontosAcaoAtuais);
            
            await proximoTurno(); 
            
            if (jogoAtivo) {
                dia++;
                pontosAcaoAtuais = PONTOS_ACAO_POR_DIA - dividaAcao;
                if (dividaAcao > 0) {
                    adicionarLog(`Você começou o dia "negativado" com ${pontosAcaoAtuais} AçD.`, "log-evento");
                }
            }
        }
        
        acaoEmProgresso = false; 
        
        if (jogoAtivo) {
             if (dia > diasObjetivo) {
                gameWin();
            } else {
                atualizarStatus();
            }
        }
    }

    // --- Lógica de Custo (Energia ou Vida) ---
    function pagarCustoEnergia(custoEnergia) {
        if (energia >= custoEnergia) {
            energia -= custoEnergia;
            return true;
        } else {
            const custoVida = (custoEnergia / 5) * 10;
            
            adicionarLog(`Sem energia! Você força o limite, custando ${custoVida} de Vida.`, "log-ruim");
            energia = 0;
            vida -= custoVida;
            
            if (vida <= 0) {
                gameOver(); 
                return false;
            }
            return true;
        }
    }

    // --- Ações Específicas ---
    
    function acaoCacar() {
        if (cacasConsecutivas >= 2) {
            adicionarLog("Você caçou demais. Faça outra atividade.", "log-ruim");
            return;
        }
        if (!pagarCustoEnergia(30)) return;
        
        realizarAcao(3, 
            () => { // fnSucesso
                let carnesGanhas = 0;
                const chance = Math.random();
                if (chance < 0.35) carnesGanhas = 1;
                else if (chance < 0.65) carnesGanhas = 2;
                else if (chance < 0.85) carnesGanhas = 3;
                else carnesGanhas = 4;
                
                carne += carnesGanhas;
                adicionarLog(`BOA! Você conseguiu ${carnesGanhas} carne(s).`, "log-bom");
                cacasConsecutivas++;
                coletasConsecutivas = 0;
            }
        );
    }

    function acaoColetarMadeira() {
        if (coletasConsecutivas >= 2) {
            adicionarLog("Você coletou demais. Faça outra atividade.", "log-ruim");
            return;
        }
        if (!pagarCustoEnergia(35)) return;

        realizarAcao(2,
            () => { // fnSucesso
                const ganhoMadeira = Math.floor(Math.random() * 3) + 1;
                madeira += ganhoMadeira;
                adicionarLog(`Você coletou ${ganhoMadeira} de madeira.`, "log-bom");
                coletasConsecutivas++;
                cacasConsecutivas = 0;
            }
        );
    }

    function acaoDescansar() {
        if (!pagarCustoEnergia(50)) return;

        realizarAcao(1,
            () => { // fnSucesso
                let vidaRecuperada = 20;
                vida += vidaRecuperada;
                if (vida > 100) vida = 100;
                adicionarLog(`Você descansou e recuperou ${vidaRecuperada} de vida.`, "log-bom");
                cacasConsecutivas = 0;
                coletasConsecutivas = 0;
            }
        );
    }
    
    async function acaoMelhorarBase() {
        if (!jogoAtivo || acaoEmProgresso) return;
        
        const custoBaseMadeira = (nivelBase + 1) * 10;
        if (madeira < custoBaseMadeira) {
            adicionarLog(`Você precisa de ${custoBaseMadeira} de madeira para melhorar a base.`, "log-ruim");
            return;
        }
        if (pontosAcaoAtuais < 4) {
            adicionarLog(`Você precisa de um dia inteiro (4 AçD) para melhorar a base.`, "log-ruim");
            return;
        }
        if (!pagarCustoEnergia(50)) return;

        acaoEmProgresso = true;
        madeira -= custoBaseMadeira;
        nivelBase++;
        pontosAcaoAtuais = 0;
        cacasConsecutivas = 0;
        coletasConsecutivas = 0;
        adicionarLog(`VOCÊ PASSA O DIA MELHORANDO SUA BASE! (Nível ${nivelBase})`, "log-bom");
        
        atualizarStatus(); 

        await new Promise(r => setTimeout(r, 500));
        await proximoTurno();
        
        if (jogoAtivo) {
            dia++;
            pontosAcaoAtuais = PONTOS_ACAO_POR_DIA;
        }
        
        acaoEmProgresso = false;
        
        if (jogoAtivo) {
             if (dia > diasObjetivo) {
                gameWin();
            } else {
                atualizarStatus();
            }
        }
    }

    function acaoComer() {
        if (!jogoAtivo || acaoEmProgresso) return;
        if (carne > 0) {
            carne--;
            let energiaRecuperada = Math.floor(Math.random() * 21) + 40;
            energia += energiaRecuperada;
            if (energia > 100) energia = 100;
            adicionarLog(`Você comeu 1 carne e recuperou ${energiaRecuperada} de energia.`, "log-bom");
            atualizarStatus();
        } else {
            adicionarLog("Você não tem carne no inventário!", "log-ruim");
        }
    }


    // --- Lógica de Turnos e Eventos ---

    async function proximoTurno() {
        if (!jogoAtivo) return;

        let gastoMetabolismo = 15 - (nivelBase * 2);
        if (gastoMetabolismo < 5) gastoMetabolismo = 5;
        energia -= gastoMetabolismo;
        if (nivelBase > 0) {
            adicionarLog(`Seu abrigo (Nv.${nivelBase}) te protegeu do frio.`, "log-bom");
        }

        if (energia <= 0) {
            energia = 0;
            adicionarLog("Você está exausto e faminto! Sua vida está diminuindo.", "log-ruim");
            vida -= 10;
        }

        await eventoAleatorio();

        if (vida <= 0) {
            vida = 0;
            gameOver();
        }
    }

    async function eventoAleatorio() {
        const chance = Math.random();
        
        if (nivelBase >= 2) {
            let chanceProtecao = (nivelBase - 1) * 0.25;
            if (Math.random() < chanceProtecao) {
                await mostrarAlerta("Proteção!", `Sua base (Nv.${nivelBase}) protegeu você de um evento ruim.`);
                return;
            }
        }

        if (dia > 5 && chance < 0.15) { // Ataque (15%)
            adicionarLog("[EVENTO] Um animal selvagem te ataca! SE DEFENDA!", "log-evento");
            const vitoria = await iniciarMinigameAtaque();
            
            if (vitoria) {
                adicionarLog("Ufa! Você conseguiu espantar o animal!", "log-bom");
            } else {
                adicionarLog("Você foi lento! O animal te feriu.", "log-ruim");
                let dano = Math.floor(Math.random() * 20) + 10;
                vida -= dano;
                adicionarLog(`Você perdeu ${dano} de vida.`, "log-ruim");
            }
        
        } else if (chance >= 0.15 && chance < 0.30) { // Tempestade (15%)
            await mostrarAlerta("Tempestade!", "Uma tempestade terrível! Você acorda cansado.");
            energia -= 20;
            adicionarLog("Você perdeu 20 de energia extra.", "log-ruim");
        
        } else if (dia > 10 && chance >= 0.30 && chance < 0.35 && nivelBase > 0) { // Dano na base (5%)
            await mostrarAlerta("Ventos Fortes!", "Ventos fortes danificaram seu abrigo!");
            nivelBase--;
            adicionarLog(`Sua base foi rebaixada para o Nível ${nivelBase}.`, "log-ruim");
        
        } else if (dia > 30 && chance >= 0.35 && chance < 0.40 && nivelBase > 2) { // Desastre na base (5%)
            await mostrarAlerta("DESASTRE!", "Uma árvore caiu sobre seu abrigo!");
            nivelBase = 1;
            adicionarLog("Sua base foi quase destruída! (Nível 1)", "log-ruim");
        
        } else if (chance > 0.9) { // Sorte (10%)
            let itensEncontrados = Math.floor(Math.random() * 5) + 1;
            let carneEncontrada = 0;
            let madeiraEncontrada = 0;
            
            for (let i = 0; i < itensEncontrados; i++) {
                if (Math.random() < 0.6) carneEncontrada++;
                else madeiraEncontrada++;
            }
            carne += carneEncontrada;
            madeira += madeiraEncontrada;
            let msg = `Você encontrou um baú naufragado! Dentro havia: ${carneEncontrada} carne(s) e ${madeiraEncontrada} madeira(s).`;
            await mostrarAlerta("Sorte!", msg);
            adicionarLog(msg, "log-bom");
        }

        if (vida > 100) vida = 100;
        if (energia > 100) energia = 100;
        if (energia < 0) energia = 0;
        if (vida < 0) vida = 0;
    }


    // --- Lógica do Minigame (Sem alterações) ---
    let timerId = null;
    let moveId = null;

    function iniciarMinigameAtaque() {
        return new Promise((resolve) => {
            minigameOverlay.style.display = 'flex';
            let tempoRestante = 3.0;
            minigameTimerSpan.textContent = tempoRestante.toFixed(1);

            function moverAlvo() {
                const arenaRect = minigameArena.getBoundingClientRect();
                const alvoRect = minigameAlvo.getBoundingClientRect();
                const novoTop = Math.random() * (arenaRect.height - alvoRect.height);
                const novoLeft = Math.random() * (arenaRect.width - alvoRect.width);
                minigameAlvo.style.top = `${novoTop}px`;
                minigameAlvo.style.left = `${novoLeft}px`;
            }
            
            moveId = setInterval(moverAlvo, 600);
            moverAlvo();

            function cliqueVitoria() {
                clearInterval(timerId);
                clearInterval(moveId);
                minigameOverlay.style.display = 'none';
                minigameAlvo.removeEventListener('click', cliqueVitoria);
                resolve(true);
            }
            minigameAlvo.addEventListener('click', cliqueVitoria);

            timerId = setInterval(() => {
                tempoRestante -= 0.1;
                minigameTimerSpan.textContent = tempoRestante.toFixed(1);
                
                if (tempoRestante <= 0) {
                    clearInterval(timerId);
                    clearInterval(moveId);
                    minigameOverlay.style.display = 'none';
                    minigameAlvo.removeEventListener('click', cliqueVitoria);
                    resolve(false);
                }
            }, 100);
        });
    }

    // --- Lógica do Pop-up de Alerta (Sem alterações) ---
    function mostrarAlerta(titulo, mensagem) {
        return new Promise((resolve) => {
            alertaTitulo.textContent = titulo;
            alertaMensagem.textContent = mensagem;
            alertaOverlay.style.display = 'flex';

            function fecharAlerta() {
                alertaOverlay.style.display = 'none';
                alertaOk.removeEventListener('click', fecharAlerta);
                resolve();
            }
            
            alertaOk.addEventListener('click', fecharAlerta);
        });
    }

    // --- Funções de Utilidade e Fim de Jogo ---

    function adicionarLog(mensagem, tipo = "log-normal") {
        const logEntry = document.createElement('p');
        logEntry.textContent = mensagem;
        logEntry.className = tipo;
        logArea.prepend(logEntry);
    }

    function atualizarStatus() {
        if (!jogoAtivo) return;
        
        vidaBar.value = vida;
        energiaBar.value = energia;
        vidaValor.textContent = `${vida}/100`;
        energiaValor.textContent = `${energia}/100`;
        carneStat.textContent = carne;
        madeiraStat.textContent = madeira;
        acdStat.textContent = pontosAcaoAtuais; 

        let nomeBase = "Nenhuma (Nv. 0)";
        if (nivelBase === 1) nomeBase = "Cabana Fraca (Nv. 1)";
        else if (nivelBase === 2) nomeBase = "Abrigo (Nv. 2)";
        else if (nivelBase === 3) nomeBase = "Reforçada (Nv. 3)";
        else if (nivelBase >= 4) nomeBase = `Fortaleza (Nv. ${nivelBase})`;
        baseStat.textContent = nomeBase;

        // MUDANÇA: Texto do botão da base corrigido
        btnBase.textContent = `Melhorar Base (Custa 4 AçD, 50 Energia)`;
        diaStatus.textContent = `Dia ${dia} de ${diasObjetivo}`;
        
        // Lógica de desativar botões
        btnCacar.disabled = (acaoEmProgresso || cacasConsecutivas >= 2);
        btnMadeira.disabled = (acaoEmProgresso || coletasConsecutivas >= 2);
        btnDescansar.disabled = (energia < 50 || acaoEmProgresso);
        btnBase.disabled = (madeira < (nivelBase + 1) * 10 || pontosAcaoAtuais < 4 || acaoEmProgresso || energia < 50);
        btnComer.disabled = (carne <= 0 || acaoEmProgresso);
    }

    function desativarTodosBotoes() {
        jogoAtivo = false;
        acaoEmProgresso = true;
        btnCacar.disabled = true;
        btnMadeira.disabled = true;
        btnDescansar.disabled = true;
        btnComer.disabled = true;
        btnBase.disabled = true;
    }

    function gameOver() {
        desativarTodosBotoes();
        adicionarLog("VOCÊ NÃO SOBREVIVEU...", "log-morte");
        diaStatus.textContent = `Você morreu no Dia ${dia}.`;
    }

    function gameWin() {
        desativarTodosBotoes();
        vitoriaTitulo.textContent = `VOCÊ SOBREVIVEU AOS ${diasObjetivo} DIAS!`;
        vitoriaTextoDias.textContent = `Após ${diasObjetivo} longos e exaustivos dias, você acorda com um som diferente no horizonte.`;
        vitoriaOverlay.style.display = 'flex';
    }

    // --- CONECTORES DE BOTÕES (Menu e Jogo) ---

    // Conectores do Menu
    btnTreinamento.addEventListener('click', () => iniciarJogo(10, "Treinamento"));
    btnFacil.addEventListener('click', () => iniciarJogo(50, "Fácil"));
    btnMedio.addEventListener('click', () => iniciarJogo(150, "Médio"));
    btnDificil.addEventListener('click', () => iniciarJogo(365, "Difícil"));
    
    // Conectores das Ações do Jogo
    btnCacar.addEventListener('click', acaoCacar);
    btnMadeira.addEventListener('click', acaoColetarMadeira);
    btnDescansar.addEventListener('click', acaoDescansar);
    btnBase.addEventListener('click', acaoMelhorarBase);
    btnComer.addEventListener('click', acaoComer);
});

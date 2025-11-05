document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos Elementos HTML (Jogo Principal) ---
    const vidaBar = document.getElementById('vida-bar');
    const vidaValor = document.getElementById('vida-valor');
    const energiaBar = document.getElementById('energia-bar');
    const energiaValor = document.getElementById('energia-valor');
    const comidaStat = document.getElementById('comida-stat');
    const madeiraStat = document.getElementById('madeira-stat');
    const baseStat = document.getElementById('base-stat');
    const diaStatus = document.getElementById('dia-status');
    const logArea = document.getElementById('log-area');
    const pontosAcaoStat = document.getElementById('pontos-acao-stat'); // Corrigido

    const btnCacar = document.getElementById('btn-cacar');
    const btnMadeira = document.getElementById('btn-madeira');
    const btnDescansar = document.getElementById('btn-descansar');
    const btnComer = document.getElementById('btn-comer');
    const btnBase = document.getElementById('btn-base');

    // --- Referências aos Elementos HTML (Pop-ups) ---
    const minigameOverlay = document.getElementById('minigame-overlay');
    const minigameArena = document.getElementById('minigame-arena');
    const minigameAlvo = document.getElementById('minigame-alvo');
    const minigameTimerSpan = document.querySelector('#minigame-timer span');
    
    const alertaOverlay = document.getElementById('alerta-overlay');
    const alertaTitulo = document.getElementById('alerta-titulo');
    const alertaMensagem = document.getElementById('alerta-mensagem');
    const alertaOk = document.getElementById('alerta-ok');

    const vitoriaOverlay = document.getElementById('vitoria-overlay');

    // --- Variáveis de Estado do Jogo ---
    let vida = 100;
    let energia = 100;
    let comida = 3;
    let madeira = 0;
    let nivelBase = 0;
    let dia = 1;
    const diasObjetivo = 365; // META ATUALIZADA
    
    const PONTOS_ACAO_POR_DIA = 4;
    let pontosAcaoAtuais = PONTOS_ACAO_POR_DIA;
    
    let jogoAtivo = true;
    let acaoEmProgresso = false;

    // --- Função Mestra de Ação ---
    async function realizarAcao(custoPA, custoEnergia, fnSucesso, fnFalhaEnergia) {
        if (!jogoAtivo || acaoEmProgresso) return;

        if (energia < custoEnergia) {
            fnFalhaEnergia();
            return;
        }

        acaoEmProgresso = true;
        energia -= custoEnergia;
        pontosAcaoAtuais -= custoPA;
        
        atualizarStatus(); // BUGFIX 1: Atualiza o contador de PA imediatamente

        // Simula o tempo da ação
        await new Promise(r => setTimeout(r, 500)); 
        
        fnSucesso(); // Executa o sucesso (ganhar comida, madeira, etc.)

        // Verifica se o dia deve passar
        if (pontosAcaoAtuais <= 0) {
            let dividaAcao = Math.abs(pontosAcaoAtuais);
            
            await proximoTurno(); // Passa a noite
            
            if (jogoAtivo) { // Se sobreviveu à noite
                dia++;
                pontosAcaoAtuais = PONTOS_ACAO_POR_DIA - dividaAcao; // Define PA para o novo dia
                
                // BUGFIX 2: Adiciona o log da "negativada"
                if (dividaAcao > 0) {
                    adicionarLog(`Você começou o dia "negativado" com ${pontosAcaoAtuais} PA.`, "log-evento");
                }
            }
        }
        
        acaoEmProgresso = false;
        
        // Verifica se o jogo acabou (vitória ou morte)
        if (jogoAtivo) {
             if (dia > diasObjetivo) {
                gameWin();
            } else {
                atualizarStatus(); // Atualiza o status para o novo dia/novo PA
            }
        }
    }

    // --- Ações Específicas ---

    btnCacar.addEventListener('click', () => {
        realizarAcao(3, 20, 
            () => { // Sucesso
                const sucessoCaca = Math.floor(Math.random() * 4);
                if (sucessoCaca > 0) {
                    comida += sucessoCaca;
                    adicionarLog(`BOA! Você conseguiu ${sucessoCaca} porções de comida.`, "log-bom");
                } else {
                    adicionarLog("DROGA! Você não encontrou nada.", "log-ruim");
                }
            },
            () => { // Falha
                adicionarLog("Você está cansado demais para caçar.", "log-evento");
            }
        );
    });

    btnMadeira.addEventListener('click', () => {
        realizarAcao(2, 15,
            () => { // Sucesso
                const ganhoMadeira = Math.floor(Math.random() * 3) + 1;
                madeira += ganhoMadeira;
                adicionarLog(`Você coletou ${ganhoMadeira} de madeira.`, "log-bom");
            },
            () => { // Falha
                adicionarLog("Você está cansado demais para coletar madeira.", "log-evento");
            }
        );
    });

    btnDescansar.addEventListener('click', () => {
        realizarAcao(1, 5,
            () => { // Sucesso
                let vidaRecuperada = Math.floor(Math.random() * 21) + 15;
                vida += vidaRecuperada;
                if (vida > 100) vida = 100;
                adicionarLog(`Você descansou e recuperou ${vidaRecuperada} de vida.`, "log-bom");
            },
            () => { // Falha
                adicionarLog("Você precisa de um mínimo de 5 de energia para descansar.", "log-evento");
            }
        );
    });
    
    btnBase.addEventListener('click', () => {
        const custoBaseMadeira = (nivelBase + 1) * 10;
        if (madeira < custoBaseMadeira) {
            adicionarLog(`Você precisa de ${custoBaseMadeira} de madeira para melhorar a base.`, "log-ruim");
            return;
        }
        
        realizarAcao(1, 0,
            () => { // Sucesso
                madeira -= custoBaseMadeira;
                nivelBase++;
                adicionarLog(`VOCÊ MELHOROU SUA BASE! (Nível ${nivelBase})`, "log-bom");
            },
            () => {}
        );
    });

    btnComer.addEventListener('click', () => {
        if (!jogoAtivo || acaoEmProgresso) return;
        if (comida > 0) {
            comida--;
            let energiaRecuperada = Math.floor(Math.random() * 21) + 40;
            energia += energiaRecuperada;
            if (energia > 100) energia = 100;
            adicionarLog(`Você comeu e recuperou ${energiaRecuperada} de energia.`, "log-bom");
            atualizarStatus();
        } else {
            adicionarLog("Você não tem comida no inventário!", "log-ruim");
        }
    });


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
                await mostrarAlerta("Proteção!", "Uma tempestade se formou, mas sua base (Nv." + nivelBase + ") protegeu você.");
                return;
            }
        }

        if (dia > 5 && chance < 0.15) { // Ataque de Animal
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
        
        } else if (chance < 0.30) { // Tempestade
            await mostrarAlerta("Tempestade!", "Uma tempestade terrível! Você acorda cansado.");
            energia -= 20;
            adicionarLog("Você perdeu 20 de energia extra.", "log-ruim");
        
        } else if (dia > 10 && chance < 0.40 && nivelBase > 0) { // Dano na base
            await mostrarAlerta("Ventos Fortes!", "Ventos fortes danificaram seu abrigo!");
            nivelBase--;
            adicionarLog("Sua base foi rebaixada para o Nível " + nivelBase, "log-ruim");
        
        } else if (dia > 30 && chance < 0.45 && nivelBase > 2) { // Desastre na base
            await mostrarAlerta("DESASTRE!", "Uma árvore caiu sobre seu abrigo!");
            nivelBase = 1;
            adicionarLog("Sua base foi quase destruída! (Nível 1)", "log-ruim");
        
        // ===== MELHORIA: BAÚ ALEATÓRIO =====
        } else if (chance > 0.9) { 
            let itensEncontrados = Math.floor(Math.random() * 5) + 1; // 1 a 5 itens
            let comidaEncontrada = 0;
            let madeiraEncontrada = 0;
            
            for (let i = 0; i < itensEncontrados; i++) {
                if (Math.random() < 0.6) { // 60% chance de ser comida
                    comidaEncontrada++;
                } else { // 40% chance de ser madeira
                    madeiraEncontrada++;
                }
            }
            
            comida += comidaEncontrada;
            madeira += madeiraEncontrada;
            
            let msg = `Você encontrou um baú naufragado! Dentro havia: ${comidaEncontrada} comida(s) e ${madeiraEncontrada} madeira(s).`;
            await mostrarAlerta("Sorte!", msg);
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
        comidaStat.textContent = comida;
        madeiraStat.textContent = madeira;
        
        // BUGFIX 1: Esta linha corrige o contador de PA
        pontosAcaoStat.textContent = pontosAcaoAtuais; 

        let nomeBase = "Nenhuma (Nv. 0)";
        if (nivelBase === 1) nomeBase = "Cabana Fraca (Nv. 1)";
        else if (nivelBase === 2) nomeBase = "Abrigo (Nv. 2)";
        else if (nivelBase === 3) nomeBase = "Reforçada (Nv. 3)";
        else if (nivelBase >= 4) nomeBase = `Fortaleza (Nv. ${nivelBase})`;
        baseStat.textContent = nomeBase;

        btnBase.textContent = `Melhorar Base (Custa 1 PA, ${(nivelBase + 1) * 10} Madeira)`;
        diaStatus.textContent = `Dia ${dia} de ${diasObjetivo}`;
        
        btnCacar.disabled = (energia < 20 || acaoEmProgresso);
        btnMadeira.disabled = (energia < 15 || acaoEmProgresso);
        btnDescansar.disabled = (energia < 5 || acaoEmProgresso);
        btnBase.disabled = (madeira < (nivelBase + 1) * 10 || acaoEmProgresso);
        btnComer.disabled = (comida <= 0 || acaoEmProgresso);
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
        // Não precisa chamar atualizarStatus() pois desativarTodosBotoes já trava tudo.
    }

    function gameWin() {
        desativarTodosBotoes();
        // MELHORIA: Mostra a tela de vitória
        vitoriaOverlay.style.display = 'flex';
    }

    // --- Inicialização do Jogo ---
    atualizarStatus(); // Define o status inicial (incluindo PA = 4)
});

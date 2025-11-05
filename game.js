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
    const pontosAcaoStat = document.getElementById('pontos-acao-stat');

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
    const diasObjetivo = 365;
    
    // ===== NOVO SISTEMA DE PONTOS DE AÇÃO (PA) =====
    const PONTOS_ACAO_POR_DIA = 4;
    let pontosAcaoAtuais = PONTOS_ACAO_POR_DIA;
    
    let jogoAtivo = true;
    let acaoEmProgresso = false; // Evita cliques duplos

    // --- Funções de Ação (Que gastam PA e Energia) ---
    
    async function realizarAcao(custoPA, custoEnergia, fnSucesso, fnFalhaEnergia) {
        if (!jogoAtivo || acaoEmProgresso) return;

        // Verifica Energia
        if (energia < custoEnergia) {
            fnFalhaEnergia();
            return;
        }

        acaoEmProgresso = true; // Trava o jogo
        energia -= custoEnergia;
        
        // Simula o tempo da ação
        await new Promise(r => setTimeout(r, 500)); 
        
        fnSucesso(); // Executa o sucesso (ganhar comida, madeira, etc.)

        pontosAcaoAtuais -= custoPA;

        // Verifica se o dia deve passar
        if (pontosAcaoAtuais <= 0) {
            let dividaAcao = Math.abs(pontosAcaoAtuais); // A "negativada"
            
            // Passa a noite (eventos, metabolismo)
            await proximoTurno(); 
            
            // Se ainda estiver vivo, começa o novo dia
            if (jogoAtivo) {
                dia++;
                pontosAcaoAtuais = PONTOS_ACAO_POR_DIA - dividaAcao;
                if (dividaAcao > 0) {
                    adicionarLog(`Você gastou energia extra e começou o dia com ${pontosAcaoAtuais} PA.`, "log-evento");
                }
            }
        }
        
        acaoEmProgresso = false; // Libera o jogo
        
        // Verifica se o jogo acabou (vitória ou morte)
        if (jogoAtivo) {
             if (dia > diasObjetivo) {
                gameWin();
            } else {
                atualizarStatus();
            }
        }
    }

    // --- Ações Específicas ---

    // CAÇAR: Custo 3 PA, 20 Energia
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
            () => { // Falha (sem energia)
                adicionarLog("Você está cansado demais para caçar.", "log-evento");
            }
        );
    });

    // COLETAR MADEIRA: Custo 2 PA, 15 Energia
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

    // DESCANSAR: Custo 1 PA, 5 Energia
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
    
    // MELHORAR BASE: Custo 1 PA, 0 Energia
    btnBase.addEventListener('click', () => {
        const custoBaseMadeira = (nivelBase + 1) * 10;
        if (madeira < custoBaseMadeira) {
            adicionarLog(`Você precisa de ${custoBaseMadeira} de madeira para melhorar a base.`, "log-ruim");
            return; // Falha (sem madeira), não gasta PA
        }
        
        realizarAcao(1, 0,
            () => { // Sucesso
                madeira -= custoBaseMadeira;
                nivelBase++;
                adicionarLog(`VOCÊ MELHOROU SUA BASE! (Nível ${nivelBase})`, "log-bom");
            },
            () => {} // Nunca falha por energia
        );
    });

    // COMER: Custo 0 PA, 0 Energia
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

        // 1. Metabolismo (Passagem do tempo)
        let gastoMetabolismo = 15 - (nivelBase * 2);
        if (gastoMetabolismo < 5) gastoMetabolismo = 5;
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

        // 3. Eventos Aleatórios (agora pausam o jogo)
        await eventoAleatorio();

        // 4. Verificar Morte
        if (vida <= 0) {
            vida = 0;
            gameOver();
        }
    }

    async function eventoAleatorio() {
        const chance = Math.random();
        
        // Proteção da Base (Nv. 2+)
        if (nivelBase >= 2) {
            let chanceProtecao = (nivelBase - 1) * 0.25;
            if (Math.random() < chanceProtecao) {
                await mostrarAlerta("Proteção!", "Uma tempestade se formou, mas sua base (Nv." + nivelBase + ") protegeu você.");
                return;
            }
        }

        // Eventos
        if (dia > 5 && chance < 0.15) { // Ataque de Animal
            adicionarLog("[EVENTO] Um animal selvagem te ataca! SE DEFENDA!", "log-evento");
            const vitoria = await iniciarMinigameAtaque(); // Espera o minigame
            
            if (vitoria) {
                adicionarLog("Ufa! Você conseguiu espantar o animal!", "log-bom");
            } else {
                adicionarLog("Você foi lento! O animal te feriu.", "log-ruim");
                let dano = Math.floor(Math.random() * 20) + 10;
                vida -= dano;
                adicionarLog(`Você perdeu ${dano} de vida.`, "log-ruim");
            }
        
        } else if (chance < 0.30) { // Tempestade (cansaço)
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
        
        } else if (chance > 0.9) { // Sorte
            await mostrarAlerta("Sorte!", "Você encontrou um baú naufragado!");
            comida += 3;
            madeira += 5;
        }

        // Limpeza de status
        if (vida > 100) vida = 100;
        if (energia > 100) energia = 100;
        if (energia < 0) energia = 0;
        if (vida < 0) vida = 0;
    }


    // --- ===== LÓGICA DO MINIGAME DE ATAQUE ===== ---
    // (Igual ao anterior, funciona com 'Promise' para pausar o jogo)
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
                resolve(true); // Venceu
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
                    resolve(false); // Perdeu
                }
            }, 100);
        });
    }

    // --- ===== NOVO: POP-UP DE ALERTA (PAUSA O JOGO) ===== ---
    
    function mostrarAlerta(titulo, mensagem) {
        return new Promise((resolve) => {
            alertaTitulo.textContent = titulo;
            alertaMensagem.textContent = mensagem;
            alertaOverlay.style.display = 'flex';

            function fecharAlerta() {
                alertaOverlay.style.display = 'none';
                alertaOk.removeEventListener('click', fecharAlerta);
                resolve(); // Continua o jogo
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
        
        // Barras e Valores
        vidaBar.value = vida;
        energiaBar.value = energia;
        vidaValor.textContent = `${vida}/100`;
        energiaValor.textContent = `${energia}/100`;
        comidaStat.textContent = comida;
        madeiraStat.textContent = madeira;
        pontosAcaoAtuais.textContent = pontosAcaoAtuais;

        // Lógica da Base
        let nomeBase = "Nenhuma (Nv. 0)";
        if (nivelBase === 1) nomeBase = "Cabana Fraca (Nv. 1)";
        else if (nivelBase === 2) nomeBase = "Abrigo (Nv. 2)";
        else if (nivelBase === 3) nomeBse = "Reforçada (Nv. 3)";
        else if (nivelBase >= 4) nomeBase = `Fortaleza (Nv. ${nivelBase})`;
        baseStat.textContent = nomeBase;

        // Atualiza custo do botão da base
        btnBase.textContent = `Melhorar Base (Custa 1 PA, ${(nivelBase + 1) * 10} Madeira)`;

        // Atualiza status do dia
        diaStatus.textContent = `Dia ${dia} de ${diasObjetivo}`;
        
        // Desativa botões de energia se não houver suficiente
        btnCacar.disabled = energia < 20;
        btnMadeira.disabled = energia < 15;
        btnDescansar.disabled = energia < 5;
    }

    function desativarTodosBotoes() {
        jogoAtivo = false;
        acaoEmProgresso = true; // Trava o jogo
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
        atualizarStatus();
    }

    function gameWin() {
        desativarTodosBotoes();
        // Mostra a tela de vitória
        vitoriaOverlay.style.display = 'flex';
    }

    // --- Inicialização do Jogo ---
    atualizarStatus();
});

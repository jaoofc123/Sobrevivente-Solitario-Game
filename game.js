document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos Elementos HTML ---
    const carneStat = document.getElementById('carne-stat');
    const madeiraStat = document.getElementById('madeira-stat');
    const baseStat = document.getElementById('base-stat');
    const vidaBar = document.getElementById('vida-bar');
    const vidaValor = document.getElementById('vida-valor');
    const energiaBar = document.getElementById('energia-bar');
    const energiaValor = document.getElementById('energia-valor');
    const diaStatus = document.getElementById('dia-status');
    const logArea = document.getElementById('log-area');
    const pontosAcaoStat = document.getElementById('pontos-acao-stat');

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

    // --- Variáveis de Estado do Jogo ---
    let vida = 100;
    let energia = 100;
    let carne = 3;
    let madeira = 0;
    let nivelBase = 0;
    let dia = 1;
    const diasObjetivo = 365;
    
    const PONTOS_ACAO_POR_DIA = 4;
    let pontosAcaoAtuais = PONTOS_ACAO_POR_DIA;
    
    // MUDANÇA: Variável para o Cooldown de Caça
    let cacasConsecutivas = 0;
    
    let jogoAtivo = true;
    let acaoEmProgresso = false;

    // --- Função Mestra de Ação (Refatorada) ---
    async function realizarAcao(custoPA, fnSucesso) {
        if (!jogoAtivo || acaoEmProgresso) return;

        acaoEmProgresso = true;
        pontosAcaoAtuais -= custoPA;
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
                    adicionarLog(`Você começou o dia "negativado" com ${pontosAcaoAtuais} PA.`, "log-evento");
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
    function pagarCustoEnergia(custoEnergia, custoVida) {
        if (energia >= custoEnergia) {
            energia -= custoEnergia;
            return true; // Pagou com energia
        } else {
            adicionarLog(`Sem energia! Você força o limite, custando ${custoVida} de Vida.`, "log-ruim");
            energia = 0;
            vida -= custoVida;
            
            if (vida <= 0) {
                gameOver(); 
                return false;
            }
            return true; // Pagou com vida
        }
    }

    // --- Ações Específicas (Atualizadas) ---

    // CAÇAR: Custo 3 PA, 20 Energia (ou 10 Vida)
    btnCacar.addEventListener('click', () => {
        // MUDANÇA: Verificação do Cooldown
        if (cacasConsecutivas >= 2) {
            adicionarLog("Você caçou demais e assustou os animais. Descanse ou faça outra atividade.", "log-ruim");
            return;
        }

        if (!pagarCustoEnergia(20, 10)) return;
        
        realizarAcao(3, 
            () => { // fnSucesso
                let carnesGanhas = 0;
                const chance = Math.random();
                if (chance < 0.35) {
                    carnesGanhas = 1;
                } else if (chance < 0.65) {
                    carnesGanhas = 2;
                } else if (chance < 0.85) {
                    carnesGanhas = 3;
                } else {
                    carnesGanhas = 4;
                }
                
                carne += carnesGanhas;
                adicionarLog(`BOA! Você conseguiu ${carnesGanhas} carne(s).`, "log-bom");
                cacasConsecutivas++; // MUDANÇA: Incrementa o contador de caça
            }
        );
    });

    // COLETAR MADEIRA: Custo 2 PA, 15 Energia (ou 10 Vida)
    btnMadeira.addEventListener('click', () => {
        if (!pagarCustoEnergia(15, 10)) return;

        realizarAcao(2,
            () => { // fnSucesso
                const ganhoMadeira = Math.floor(Math.random() * 3) + 1;
                madeira += ganhoMadeira;
                adicionarLog(`Você coletou ${ganhoMadeira} de madeira.`, "log-bom");
                cacasConsecutivas = 0; // MUDANÇA: Reseta o cooldown de caça
            }
        );
    });

    // DESCANSAR: Custo 1 PA, 0 Energia
    btnDescansar.addEventListener('click', () => {
        // MUDANÇA: Custo de energia removido. Conserto do "Soft-Lock".
        realizarAcao(1,
            () => { // fnSucesso
                // MUDANÇA: Cura reduzida (balanceamento)
                let vidaRecuperada = Math.floor(Math.random() * 11) + 10; // 10 a 20 de vida
                vida += vidaRecuperada;
                if (vida > 100) vida = 100;
                adicionarLog(`Você descansou e recuperou ${vidaRecuperada} de vida.`, "log-bom");
                cacasConsecutivas = 0; // MUDANÇA: Reseta o cooldown de caça
            }
        );
    });
    
    // MELHORAR BASE: Custo 4 PA (Dia inteiro), 0 Energia
    btnBase.addEventListener('click', async () => {
        if (!jogoAtivo || acaoEmProgresso) return;
        
        const custoBaseMadeira = (nivelBase + 1) * 10;
        if (madeira < custoBaseMadeira) {
            adicionarLog(`Você precisa de ${custoBaseMadeira} de madeira para melhorar a base.`, "log-ruim");
            return;
        }
        
        if (pontosAcaoAtuais < 4) {
            adicionarLog(`Você precisa de um dia inteiro (4 PA) para melhorar a base.`, "log-ruim");
            return;
        }

        acaoEmProgresso = true;
        madeira -= custoBaseMadeira;
        nivelBase++;
        pontosAcaoAtuais = 0; // Gasta todos os PAs
        cacasConsecutivas = 0; // MUDANÇA: Reseta o cooldown de caça
        adicionarLog(`VOCÊ PASSA O DIA MELHORANDO SUA BASE! (Nível ${nivelBase})`, "log-bom");
        
        await new Promise(r => setTimeout(r, 500));

        await proximoTurno();
        
        if (jogoAtivo) {
            dia++;
            pontosAcaoAtuais = PONTOS_ACAO_POR_DIA;
            atualizarStatus();
        }
        
        acaoEmProgresso = false;
        
        if (jogoAtivo && dia > diasObjetivo) {
            gameWin();
        }
    });

    // COMER: Custo 0 PA, 0 Energia
    btnComer.addEventListener('click', () => {
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
        
        } else if (dia > 10 && chance >= 0.30 && chance < 0.50 && nivelBase > 0) { // Dano na base (20%)
            await mostrarAlerta("Ventos Fortes!", "Ventos fortes danificaram seu abrigo!");
            nivelBase--;
            adicionarLog(`Sua base foi rebaixada para o Nível ${nivelBase}.`, "log-ruim");
        
        } else if (dia > 30 && chance >= 0.50 && chance < 0.55 && nivelBase > 2) { // Desastre na base (5%)
            await mostrarAlerta("DESASTRE!", "Uma árvore caiu sobre seu abrigo!");
            nivelBase = 1;
            adicionarLog("Sua base foi quase destruída! (Nível 1)", "log-ruim");
        
        } else if (chance > 0.9) { // Sorte (10%)
            let itensEncontrados = Math.floor(Math.random() * 5) + 1;
            let carneEncontrada = 0;
            let madeiraEncontrada = 0;
            
            for (let i = 0; i < itensEncontrados; i++) {
                if (Math.random() < 0.6) {
                    carneEncontrada++;
                } else {
                    madeiraEncontrada++;
                }
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
        pontosAcaoStat.textContent = pontosAcaoAtuais; 

        let nomeBase = "Nenhuma (Nv. 0)";
        if (nivelBase === 1) nomeBase = "Cabana Fraca (Nv. 1)";
        else if (nivelBase === 2) nomeBase = "Abrigo (Nv. 2)";
        else if (nivelBase === 3) nomeBase = "Reforçada (Nv. 3)";
        else if (nivelBase >= 4) nomeBase = `Fortaleza (Nv. ${nivelBase})`;
        baseStat.textContent = nomeBase;

        btnBase.textContent = `Melhorar Base (Custa 4 PA, ${(nivelBase + 1) * 10} Madeira)`;
        diaStatus.textContent = `Dia ${dia} de ${diasObjetivo}`;
        
        // MUDANÇA: Lógica de desativar botões
        btnCacar.disabled = (acaoEmProgresso || cacasConsecutivas >= 2);
        btnMadeira.disabled = acaoEmProgresso;
        btnDescansar.disabled = acaoEmProgresso; // Não depende mais de energia
        btnBase.disabled = (madeira < (nivelBase + 1) * 10 || pontosAcaoAtuais < 4 || acaoEmProgresso);
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
        vitoriaOverlay.style.display = 'flex';
    }

    // --- Inicialização do Jogo ---
    atualizarStatus();
});

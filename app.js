class UIManager {
  constructor() {
    this.ui = UIManager.getElements([
      '#ipInput', '#statusMsg', '#btnCalcular', '#resultsArea',
      '#resIp', '#resMask', '#resNet', '#resBroad', '#resultsPopup'
    ]);

    this.classBtns = document.querySelectorAll('.class-btn');
    this.setupEvents();
  }
  
  /**
   * Mapeia um array de seletores CSS em um objeto de elementos do DOM.
   * @param {string[]} arrayElements - Lista de seletores (ex: ['#app', '.btn']).
   * @returns {Record<string, Element|null>} Objeto com os elementos mapeados.
   */
  static getElements(arrayElements) {
    return arrayElements.reduce((listElements, nameItem) => {
      const keyName = nameItem.replace(/^[#.]/, '');

      listElements[keyName] = document.querySelector(nameItem);
      return listElements;
    }, {}); // 1.2 
  }

  setupEvents() {
    this.classBtns.forEach(btn => {
      btn.addEventListener('click', (evento) => this.handleClassToggle(evento.currentTarget));
    });

    this.ui.btnCalcular.addEventListener('click', () => this.handleCalculateClick());
  }

  handleClassToggle(clickedBtn) {
    this.classBtns.forEach(bnt => {
      bnt.classList.remove('bg-[#1c1c1e]', 'text-[#f2f2f2]', 'active');
      bnt.classList.add('bg-transparent', 'text-[#8e8e93]');
    })

    clickedBtn.classList.remove('bg-transparent', 'text-[#8e8e93]');
    clickedBtn.classList.add('bg-[#1c1c1e]', 'text-[#f2f2f2]', 'active');
  }

  /**
   * Manipula o evento de clique do botão calcular.
   * Valida o campo de entrada de IP, exibe animação de carregamento
   * e gerencia as mensagens de sucesso ou erro na tela.
   * @returns {void}
   */
  handleCalculateClick() {
    const inputValue = this.ui.ipInput.value.trim();
    
    this.showLoading();

    setTimeout(() => {
      try {
        if (inputValue === "") {
          throw new Error("Por favor, digite um IP ou Máscara.");
        }

        const ipPart = inputValue.split(/[\s/]+/)[0]; //eu pego o resto para validar o /24
        
        if (!IPv4Calculator.isValidIPv4(ipPart)) {
          throw new Error("IP inválido! Digite um formato correto (ex: 192.168.0.1).");
        }

        this.showSuccess("IP validado com sucesso!");

        setTimeout(() => this.hideStatus(), 1000);
      } catch(e) {
        this.showError(e.message);
      }
    }, 600);
  }

  showLoading() {
    this.ui.statusMsg.className = "p-3 rounded-xl mt-3 text-[13px] font-semibold flex justify-center items-center gap-2 border border-[#333] bg-black text-[#8e8e93]";
    this.ui.statusMsg.innerHTML = '<div class="w11-spinner"></div> Calculando...';
  }

  showSuccess(mensagem) {
    this.ui.statusMsg.className = "p-3 rounded-xl mt-3 text-[13px] font-semibold block border border-[#32d74b] bg-[#163a16] text-[#32d74b]";
    this.ui.statusMsg.innerText = mensagem;
  }

  showError(mensagem) {
    this.ui.statusMsg.className = "p-3 rounded-xl mt-3 text-[13px] font-semibold block border border-[#ff453a] bg-[#3a1616] text-[#ff453a]";
    this.ui.statusMsg.innerText = mensagem;
    this.ui.ipInput.value = '';
    this.ui.ipInput.focus();
  }

  hideStatus() {
    this.ui.statusMsg.className = "hidden";
  }
}

class IPv4Calculator {
  static isValidIPv4(ip) {
    if (!ip || typeof ip !== 'string') return false;

    const octetos = ip.split('.');

    if (octetos.length !== 4) return false;

    return octetos.every(octeto => { 
      if (!/^\d+$/.test(octeto)) return false; 
      const num = parseInt(octeto, 10); 
      
      return num >= 0 && num <= 255 && String(num) === octeto;
    });
  }
}

const managerUi = new UIManager();


/*
  1.1 O reduce aceita um segundo parâmetro opcional que define o valor inicial do acumulador

  */
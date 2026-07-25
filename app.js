class UIManager {
  constructor() {
    this.ui = UIManager.getElements([
      '#ipInput', '#statusMsg', '#btnCalcular', '#resultsArea',
      '#resIp', '#resMask', '#resNet', '#resBroad', '#resultsPopup', '#maskInput',
      '#resBlock', '#resRange'
    ]);

    this.classBtns = document.querySelectorAll('.class-btn');
    this.ipv4Validator = new IPv4Validator(); 
    this.ipv4Calc = new IPv4Calculator(); 

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
    }, {}); // 1.4 
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
    const ipValue = this.ui.ipInput.value.trim();
    const maskValue = this.ui.maskInput.value.trim();

    const activeBtn = Array.from(this.classBtns).find(btn => btn.classList.contains('active'));
    const classe = activeBtn ? activeBtn.getAttribute('data-class') : 'C';
   
    this.clearResults();
    this.showLoading();

    setTimeout(() => {
      try {
        if (!ipValue || !maskValue) {
          throw new Error("Preencha o IP e a Máscara/CIDR.");    
        }

        if (!this.ipv4Validator.isValidIPv4(ipValue)) {
          throw new Error("Endereço IP inválido!");
        }

        this.showLoading('validando mascara');

        const maskData = this.ipv4Validator.isValidMask(maskValue, classe);
        if (!maskData.sucess) throw new Error("Mascara nao reconhecida ou errada!");

      } catch(e) {
        this.showError(e.message);
      }
    }, 600);
  }

  showLoading(msg = 'Carregando...') {
    this.ui.statusMsg.className = "p-3 rounded-xl mt-3 mb-3 text-[13px] font-semibold flex justify-center items-center gap-2 border border-[#333] bg-black text-[#8e8e93]";
    this.ui.statusMsg.innerHTML = `<div class="w11-spinner"></div> ${msg}`;
  }

  showSuccess(mensagem) {
    this.ui.statusMsg.className = "p-3 rounded-xl mt-3 mb-3 text-[13px] font-semibold block border border-[#32d74b] bg-[#163a16] text-[#32d74b]";
    this.ui.statusMsg.innerText = mensagem;
  }

  showError(mensagem) {
    this.ui.statusMsg.className = "p-3 rounded-xl mt-3 mb-3 text-[13px] font-semibold block border border-[#ff453a] bg-[#3a1616] text-[#ff453a]";
    this.ui.statusMsg.innerText = mensagem;
    this.ui.ipInput.value = '';
    this.ui.maskInput.value = '';
    this.ui.ipInput.focus();
  }

  showResults(res) {
    this.hideStatus(); 
    
    this.ui.resIp.innerText = res.ip;
    this.ui.resMask.innerText = res.mask;
    this.ui.resNet.innerText = res.network;
    this.ui.resBroad.innerText = res.broadcast;
    this.ui.resultsArea.classList.remove('hidden');

    this.ui.resBlock.innerText = res.blockSize;
    this.ui.resRange.innerText = `${res.firstHost} até ${res.lastHost}`;
    this.ui.resultsPopup.classList.remove('hidden');
    this.ui.resultsPopup.classList.add('block');
  }

  clearResults() {
    this.ui.resultsArea.classList.add('hidden');
    this.ui.resultsPopup.classList.add('hidden');
    this.ui.resultsPopup.classList.remove('block');
    
    this.ui.resIp.innerText = '-';
    this.ui.resMask.innerText = '-';
    this.ui.resNet.innerText = '-';
    this.ui.resBroad.innerText = '-';
    this.ui.resBlock.innerText = '-';
    this.ui.resRange.innerText = '-';
  }

  hideStatus() {
    this.ui.statusMsg.className = "hidden";
  }
}

class IPv4Validator {
  constructor() {
    this.classTemplates = {
      'A': '255.',
      'B': '255.255.',
      'C': '255.255.255.'
    } 
  }

  isValidIPv4(ip) {
    if (!ip || typeof ip !== 'string') return false;

    const octetos = ip.split('.');

    if (octetos.length !== 4) return false;

    return octetos.every(octeto => { // 1.1
      if (!/^\d+$/.test(octeto)) return false; // 1.2
      const num = parseInt(octeto, 10); // 1.3 
      
      return num >= 0 && num <= 255 && String(num) === octeto;
    });
  }

  isValidMask(mask, classe) {
    if (!mask) throw new Error("Informe a máscara ou CIDR.");

    const cleanInput = mask.replace('/', '');
    
    if (/^\d+$/.test(cleanInput)) {
      return this.validateCidr(cleanInput);
    } else {
      return this.validateDecimal(mask, classe);
    }
  }

  validateCidr(cidr) {
    const cidrNum = parseInt(cidr, 10);

    if (cidrNum < 0 || cidrNum > 32) {
      throw new Error("O CIDR deve estar entre 0 e 32.");
    }

    return { type: 'CIDR', value: cidrNum, sucess: true};
  }

  /**
   * Valida e interpreta uma máscara de sub-rede em formato decimal (ex: 255.255.255.0).
   * 
   * @param {string} mask - A string contendo a máscara de rede digitada pelo usuário.
   * @param {string} classe - A classe de rede ativa no momento ('A', 'B' ou 'C').
   * @throws {Error} Lança um erro detalhado se o formato, a regra de classe ou a continuidade dos bits falharem.
   * @returns {{type: string, value: string, sucess: boolean}} Objeto padronizado informando o tipo, o valor validado e o status de sucesso.
   */
  validateDecimal(mask, classe) {
    if (!this.isValidIPv4(mask)) throw new Error("Formato de máscara inválido.");

    const prefixoObrigatorio = this.classTemplates[classe];
    if (!mask.startsWith(prefixoObrigatorio)) {
      throw new Error(`A Classe ${classe} exige máscara iniciando com ${prefixoObrigatorio}x`);
    }

    const octetos = mask.split('.').map(Number);
    const valoresValidosMascara = [255, 254, 252, 248, 240, 224, 192, 128, 0];
    let fimDosBits = false;

    for (let oct of octetos) {
      if (!valoresValidosMascara.includes(oct)) {
        throw new Error(`Máscara inválida! O octeto ${oct} não existe em máscaras de rede.`);
      }

      if (fimDosBits && oct !== 0) {
        throw new Error("Máscara inválida! Ela precisa ser contínua (ex: 255.255.240.0).");
      }

      if (oct < 255) fimDosBits = true;
    }

    if (octetos[3] > 254) throw new Error("O último octeto da máscara não pode ser maior que 254.");
    
    return { type: 'DECIMAL', value: mask, sucess: true};
  }
}

class IPv4Calculator {

}

const managerUi = new UIManager();

/*
  1.1 - O every só retorna true se todos os itens passarem pelo teste.
  1.2 - Garante que contenha apenas dígitos numéricos.
  1.3 - o parseInt remove os zeros a esquerda <-, apos isso eu comparo o valor convertido
        convertendo denovo mais como por exemplo a entrada foi 025 apos a conversao fica 25,
        convertendo 25 da "25" e nao "025".
  1.4 O reduce aceita um segundo parâmetro opcional que define o valor inicial do acumulador
*/
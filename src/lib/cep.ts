// Função para buscar endereço pelo CEP usando a API ViaCEP
export interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface Endereco {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export const formatCep = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 5) {
    return numbers;
  }
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

export const buscarEnderecoPorCep = async (cep: string): Promise<Endereco | null> => {
  const cepLimpo = cep.replace(/\D/g, "");
  
  if (cepLimpo.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    
    if (!response.ok) {
      throw new Error("Erro ao buscar CEP");
    }

    const data: EnderecoViaCEP = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      rua: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
      cep: formatCep(data.cep),
    };
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
};

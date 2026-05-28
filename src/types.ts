export type ViewKey = "dashboard" | "clientes" | "cargas" | "cotacoes" | "viagens" | "financeiro";

export type FreightStatus = "Cotacao" | "Aprovado" | "Em transito" | "Entregue" | "Faturado";

export type Priority = "Alta" | "Normal";

export type Client = {
  dbId?: number;
  name: string;
  contact: string;
  origin: string;
  product: string;
  risk: "Baixo" | "Medio" | "Alto";
};

export type FreightOrder = {
  dbId?: number;
  id: string;
  client: string;
  product: string;
  origin: string;
  destination: string;
  tons: number;
  pickup: string;
  status: FreightStatus;
  priority: Priority;
  revenue: number;
  cost: number;
  driver: string;
  vehicle: string;
  progress: number;
};

export type AppData = {
  clients: Client[];
  orders: FreightOrder[];
};

export type DbClient = {
  id: number;
  nome: string;
  contato: string | null;
  origem: string | null;
  produto: string | null;
  risco: Client["risk"] | null;
};

export type DbFreightOrder = {
  id: number;
  codigo: string | null;
  cliente: string;
  produto: string;
  origem: string;
  destino: string;
  toneladas: number | string | null;
  coleta: string;
  status: FreightStatus | null;
  prioridade: Priority | null;
  receita: number | string | null;
  custo: number | string | null;
  motorista: string | null;
  veiculo: string | null;
  progresso: number | string | null;
};

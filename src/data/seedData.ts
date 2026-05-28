import type { AppData, FreightStatus } from "../types";

export const statuses: FreightStatus[] = ["Cotacao", "Aprovado", "Em transito", "Entregue", "Faturado"];

export const seedData: AppData = {
  clients: [
    {
      name: "Fazenda Boa Safra",
      contact: "Marina Alves - (66) 98110-0042",
      origin: "Sorriso, MT",
      product: "Soja",
      risk: "Baixo"
    },
    {
      name: "Agro Cerrado Trading",
      contact: "Rafael Nunes - comercial@cerradoagro.com",
      origin: "Rio Verde, GO",
      product: "Milho",
      risk: "Medio"
    },
    {
      name: "Cooperativa Vale Verde",
      contact: "Joao Martins - (45) 99322-1800",
      origin: "Cascavel, PR",
      product: "Farelo",
      risk: "Baixo"
    },
    {
      name: "Armazens Nova Rota",
      contact: "Patricia Lima - (64) 98814-6672",
      origin: "Jatai, GO",
      product: "Algodao",
      risk: "Alto"
    }
  ],
  orders: [
    {
      id: "FR-1024",
      client: "Fazenda Boa Safra",
      product: "Soja",
      origin: "Sorriso, MT",
      destination: "Santos, SP",
      tons: 32,
      pickup: "2026-06-02",
      status: "Cotacao",
      priority: "Alta",
      revenue: 14600,
      cost: 11850,
      driver: "Carlos Mendes",
      vehicle: "Bitrem ABC-4H22",
      progress: 18
    },
    {
      id: "FR-1025",
      client: "Agro Cerrado Trading",
      product: "Milho",
      origin: "Rio Verde, GO",
      destination: "Paranagua, PR",
      tons: 30,
      pickup: "2026-06-04",
      status: "Aprovado",
      priority: "Normal",
      revenue: 12750,
      cost: 10100,
      driver: "Eliane Costa",
      vehicle: "Rodotrem FRT-9C11",
      progress: 30
    },
    {
      id: "FR-1026",
      client: "Cooperativa Vale Verde",
      product: "Farelo",
      origin: "Cascavel, PR",
      destination: "Campinas, SP",
      tons: 26,
      pickup: "2026-05-31",
      status: "Em transito",
      priority: "Alta",
      revenue: 8800,
      cost: 6900,
      driver: "Andre Rocha",
      vehicle: "Carreta DKL-7J90",
      progress: 68
    },
    {
      id: "FR-1027",
      client: "Armazens Nova Rota",
      product: "Algodao",
      origin: "Jatai, GO",
      destination: "Itajai, SC",
      tons: 24,
      pickup: "2026-05-28",
      status: "Entregue",
      priority: "Normal",
      revenue: 11900,
      cost: 9450,
      driver: "Bruno Reis",
      vehicle: "Bitrem QWE-2A18",
      progress: 100
    },
    {
      id: "FR-1028",
      client: "Fazenda Boa Safra",
      product: "Soja",
      origin: "Lucas do Rio Verde, MT",
      destination: "Rondonopolis, MT",
      tons: 36,
      pickup: "2026-05-25",
      status: "Faturado",
      priority: "Normal",
      revenue: 6400,
      cost: 5150,
      driver: "Sonia Duarte",
      vehicle: "Truck HJX-8B33",
      progress: 100
    }
  ]
};

import { progressForStatus } from "./format";
import type { AppData, Client, DbClient, DbFreightOrder, FreightOrder } from "../types";
import { seedData } from "../data/seedData";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://xognohpweahpremggfhy.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ25vaHB3ZWFocHJlbWdnZmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzc0MzksImV4cCI6MjA5NTU1MzQzOX0.7AmUQf5i_DKWWeyStkhIohTKutddjBLxrTi7YkgU_e8";

async function supabaseRequest<T>(table: string, options: RequestInit & { query?: string } = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${options.query ?? ""}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

function clientFromDb(row: DbClient): Client {
  return {
    dbId: row.id,
    name: row.nome,
    contact: row.contato ?? "",
    origin: row.origem ?? "",
    product: row.produto ?? "",
    risk: row.risco ?? "Baixo"
  };
}

function orderFromDb(row: DbFreightOrder): FreightOrder {
  const status = row.status ?? "Cotacao";

  return {
    dbId: row.id,
    id: row.codigo ?? `FR-${row.id}`,
    client: row.cliente,
    product: row.produto,
    origin: row.origem,
    destination: row.destino,
    tons: Number(row.toneladas ?? 0),
    pickup: row.coleta,
    status,
    priority: row.prioridade ?? "Normal",
    revenue: Number(row.receita ?? 0),
    cost: Number(row.custo ?? 0),
    driver: row.motorista ?? "A definir",
    vehicle: row.veiculo ?? "A definir",
    progress: Number(row.progresso ?? progressForStatus(status))
  };
}

function clientToDb(client: Client) {
  return {
    nome: client.name,
    contato: client.contact,
    origem: client.origin,
    produto: client.product,
    risco: client.risk
  };
}

function orderToDb(order: FreightOrder) {
  return {
    codigo: order.id,
    cliente: order.client,
    produto: order.product,
    origem: order.origin,
    destino: order.destination,
    toneladas: order.tons,
    coleta: order.pickup,
    status: order.status,
    prioridade: order.priority,
    receita: order.revenue,
    custo: order.cost,
    motorista: order.driver,
    veiculo: order.vehicle,
    progresso: order.progress
  };
}

export async function loadDataFromSupabase(): Promise<AppData> {
  const [clients, orders] = await Promise.all([
    supabaseRequest<DbClient[]>("clientes", { query: "?select=*&order=id.desc" }),
    supabaseRequest<DbFreightOrder[]>("cargas", { query: "?select=*&order=id.desc" })
  ]);

  if (!clients.length && !orders.length) {
    await Promise.all([
      supabaseRequest<DbClient[]>("clientes", {
        method: "POST",
        body: JSON.stringify(seedData.clients.map(clientToDb))
      }),
      supabaseRequest<DbFreightOrder[]>("cargas", {
        method: "POST",
        body: JSON.stringify(seedData.orders.map(orderToDb))
      })
    ]);

    return loadDataFromSupabase();
  }

  return {
    clients: clients.map(clientFromDb),
    orders: orders.map(orderFromDb)
  };
}

export async function createClient(client: Client) {
  const [created] = await supabaseRequest<DbClient[]>("clientes", {
    method: "POST",
    body: JSON.stringify(clientToDb(client))
  });

  return clientFromDb(created);
}

export async function createOrder(order: FreightOrder) {
  const [created] = await supabaseRequest<DbFreightOrder[]>("cargas", {
    method: "POST",
    body: JSON.stringify(orderToDb(order))
  });

  return orderFromDb(created);
}

export async function updateOrderStatus(order: FreightOrder) {
  if (!order.dbId) return;

  await supabaseRequest<DbFreightOrder[]>("cargas", {
    method: "PATCH",
    query: `?id=eq.${order.dbId}`,
    body: JSON.stringify({
      status: order.status,
      progresso: order.progress
    })
  });
}

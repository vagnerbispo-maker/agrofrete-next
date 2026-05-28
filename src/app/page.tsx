"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { seedData, statuses } from "../data/seedData";
import { currency, dateLabel, normalize, progressForStatus } from "../lib/format";
import { createClient, createOrder, loadDataFromSupabase, updateOrderStatus } from "../lib/supabaseRest";
import type { AppData, Client, FreightOrder, FreightStatus, Priority, ViewKey } from "../types";

const viewTitles: Record<ViewKey, string> = {
  dashboard: "Painel operacional",
  clientes: "Clientes",
  cargas: "Ordens de carga",
  cotacoes: "Cotacoes",
  viagens: "Viagens",
  financeiro: "Financeiro"
};

const statusColors: Record<FreightStatus, string> = {
  Cotacao: "#31658f",
  Aprovado: "#2f6f4e",
  "Em transito": "#b66f12",
  Entregue: "#6f5f9c",
  Faturado: "#56615a"
};

export default function Home() {
  const [data, setData] = useState<AppData>(seedData);
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | FreightStatus>("todos");
  const [priorityFilter, setPriorityFilter] = useState<"todas" | Priority>("todas");
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [notice, setNotice] = useState("Carregando dados do Supabase...");

  useEffect(() => {
    loadDataFromSupabase()
      .then((loaded) => {
        setData(loaded);
        setNotice("Conectado ao Supabase");
      })
      .catch(() => {
        setNotice("Supabase indisponivel. Exibindo dados locais de exemplo.");
      });
  }, []);

  const filteredOrders = useMemo(() => {
    const term = normalize(search);

    return data.orders.filter((order) => {
      const haystack = normalize(Object.values(order).join(" "));
      const bySearch = !term || haystack.includes(term);
      const byPriority = priorityFilter === "todas" || order.priority === priorityFilter;
      const byStatus = statusFilter === "todos" || order.status === statusFilter;
      return bySearch && byPriority && byStatus;
    });
  }, [data.orders, priorityFilter, search, statusFilter]);

  const filteredClients = useMemo(() => {
    const term = normalize(search);
    return data.clients.filter((client) => !term || normalize(Object.values(client).join(" ")).includes(term));
  }, [data.clients, search]);

  async function handleCreateOrder(order: FreightOrder) {
    const optimistic = [order, ...data.orders];
    setData((current) => ({ ...current, orders: optimistic }));

    try {
      const saved = await createOrder(order);
      setData((current) => ({ ...current, orders: [saved, ...current.orders.filter((item) => item.id !== order.id)] }));
      setNotice("Carga salva no Supabase");
    } catch {
      setNotice("A carga ficou apenas na tela. O Supabase recusou a gravacao.");
    }
  }

  async function handleCreateClient(client: Client) {
    setData((current) => ({ ...current, clients: [client, ...current.clients] }));

    try {
      const saved = await createClient(client);
      setData((current) => ({ ...current, clients: [saved, ...current.clients.filter((item) => item.name !== client.name)] }));
      setNotice("Cliente salvo no Supabase");
    } catch {
      setNotice("O cliente ficou apenas na tela. O Supabase recusou a gravacao.");
    }
  }

  async function handleStatusChange(orderId: string, status: FreightStatus) {
    const order = data.orders.find((item) => item.id === orderId);
    if (!order) return;

    const updated = { ...order, status, progress: progressForStatus(status) };
    setData((current) => ({
      ...current,
      orders: current.orders.map((item) => (item.id === orderId ? updated : item))
    }));

    try {
      await updateOrderStatus(updated);
      setNotice("Status atualizado no Supabase");
    } catch {
      setNotice("Status alterado apenas na tela. O Supabase recusou a atualizacao.");
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onChange={setActiveView} />

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sistema de frete agricola</p>
            <h1>{viewTitles[activeView]}</h1>
          </div>
          <div className="top-actions">
            <label className="search">
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar cliente, cidade, carga..." />
            </label>
            <button className="primary" type="button" onClick={() => setOrderModalOpen(true)}>
              <span aria-hidden="true">+</span>
              Nova carga
            </button>
          </div>
        </header>

        <p className="status-note">{notice}</p>

        {activeView === "dashboard" && (
          <Dashboard orders={filteredOrders} allOrders={data.orders} statusFilter={statusFilter} onStatusFilter={setStatusFilter} />
        )}

        {activeView === "clientes" && (
          <Clients clients={filteredClients} onNewClient={() => setClientModalOpen(true)} />
        )}

        {activeView === "cargas" && (
          <Orders
            orders={filteredOrders}
            priorityFilter={priorityFilter}
            onPriorityFilter={setPriorityFilter}
            onStatusChange={handleStatusChange}
          />
        )}

        {activeView === "cotacoes" && <Quotes orders={data.orders} />}
        {activeView === "viagens" && <Drivers orders={data.orders} />}
        {activeView === "financeiro" && <Finance orders={data.orders} />}
      </main>

      {orderModalOpen && <OrderModal nextId={1024 + data.orders.length} onClose={() => setOrderModalOpen(false)} onCreate={handleCreateOrder} />}
      {clientModalOpen && <ClientModal onClose={() => setClientModalOpen(false)} onCreate={handleCreateClient} />}
    </div>
  );
}

function Sidebar({ activeView, onChange }: { activeView: ViewKey; onChange: (view: ViewKey) => void }) {
  const items: Array<[ViewKey, string, string]> = [
    ["dashboard", "Painel", "⌂"],
    ["clientes", "Clientes", "◉"],
    ["cargas", "Cargas", "▣"],
    ["cotacoes", "Cotacoes", "$"],
    ["viagens", "Viagens", "→"],
    ["financeiro", "Financeiro", "◆"]
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">AF</span>
        <div>
          <strong>AgroFrete</strong>
          <span>CRM Logistico</span>
        </div>
      </div>
      <nav className="nav" aria-label="Principal">
        {items.map(([view, label, icon]) => (
          <button key={view} className={`nav-item ${activeView === view ? "active" : ""}`} onClick={() => onChange(view)} type="button">
            <span className="icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Dashboard({
  allOrders,
  orders,
  statusFilter,
  onStatusFilter
}: {
  allOrders: FreightOrder[];
  orders: FreightOrder[];
  statusFilter: "todos" | FreightStatus;
  onStatusFilter: (value: "todos" | FreightStatus) => void;
}) {
  const revenue = allOrders.reduce((sum, order) => sum + order.revenue, 0);
  const cost = allOrders.reduce((sum, order) => sum + order.cost, 0);
  const margin = revenue ? ((revenue - cost) / revenue) * 100 : 0;
  const metrics = [
    ["Fretes ativos", allOrders.filter((order) => order.status !== "Faturado").length],
    ["Receita prevista", currency(revenue)],
    ["Margem media", `${margin.toFixed(1)}%`],
    ["Em transito", allOrders.filter((order) => order.status === "Em transito").length]
  ];

  return (
    <section>
      <div className="metrics">
        {metrics.map(([label, value]) => (
          <article className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <Charts orders={allOrders} />

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Funil de fretes</h2>
            <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as "todos" | FreightStatus)}>
              <option value="todos">Todos</option>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <Kanban orders={orders} />
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Proximas coletas</h2>
          </div>
          <Timeline orders={allOrders} />
        </section>
      </div>
    </section>
  );
}

function Charts({ orders }: { orders: FreightOrder[] }) {
  const total = Math.max(orders.length, 1);
  const circumference = 2 * Math.PI * 54;
  let offset = 0;
  const counts = statuses.map((status) => ({
    label: status,
    value: orders.filter((order) => order.status === status).length,
    color: statusColors[status]
  }));
  const revenue = orders.reduce((sum, order) => sum + order.revenue, 0);
  const cost = orders.reduce((sum, order) => sum + order.cost, 0);
  const gross = revenue - cost;
  const maxMoney = Math.max(revenue, cost, gross, 1);
  const bestMargins = [...orders].sort((a, b) => b.revenue - b.cost - (a.revenue - a.cost)).slice(0, 5);
  const maxMargin = Math.max(...bestMargins.map((order) => order.revenue - order.cost), 1);

  return (
    <div className="charts-grid">
      <article className="chart-card">
        <div className="chart-head">
          <div>
            <span>Status</span>
            <strong>Distribuicao das cargas</strong>
          </div>
        </div>
        <div className="donut-wrap">
          <svg className="donut" viewBox="0 0 150 150" role="img" aria-label="Distribuicao das cargas por status">
            <circle className="donut-bg" cx="75" cy="75" r="54" />
            {counts.filter((item) => item.value > 0).map((item) => {
              const length = (item.value / total) * circumference;
              const segmentOffset = offset;
              offset += length;
              return (
                <circle
                  key={item.label}
                  className="donut-segment"
                  cx="75"
                  cy="75"
                  r="54"
                  stroke={item.color}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-segmentOffset}
                />
              );
            })}
            <text x="75" y="70" textAnchor="middle" fontSize="24" fontWeight="800" fill="#18201c">{orders.length}</text>
            <text x="75" y="91" textAnchor="middle" fontSize="12" fill="#647067">cargas</text>
          </svg>
          <div className="legend">
            {counts.map((item) => (
              <div className="legend-item" key={item.label}>
                <span className="legend-label"><span className="swatch" style={{ background: item.color }} />{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="chart-card">
        <div className="chart-head">
          <div>
            <span>Resultado</span>
            <strong>Receita, custo e margem</strong>
          </div>
        </div>
        <div className="bar-chart">
          {[["Receita", revenue, "#2f6f4e"], ["Custo", cost, "#b66f12"], ["Margem", gross, "#31658f"]].map(([label, value, color]) => (
            <div className="bar-row" key={String(label)}>
              <span>{label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(Number(value) / maxMoney) * 100}%`, background: String(color) }} /></div>
              <span className="bar-value">{currency(Number(value))}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="chart-card">
        <div className="chart-head">
          <div>
            <span>Margem</span>
            <strong>Melhores fretes</strong>
          </div>
        </div>
        <div className="margin-list">
          {bestMargins.map((order) => {
            const orderMargin = order.revenue - order.cost;
            return (
              <div className="margin-item" key={order.id}>
                <div className="margin-line">
                  <span>{order.id} - {order.product}</span>
                  <strong>{currency(orderMargin)}</strong>
                </div>
                <div className="margin-track"><span style={{ width: `${(orderMargin / maxMargin) * 100}%` }} /></div>
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}

function Kanban({ orders }: { orders: FreightOrder[] }) {
  return (
    <div className="kanban">
      {statuses.map((status) => {
        const items = orders.filter((order) => order.status === status);
        return (
          <div className="kanban-col" key={status}>
            <h3>{status}<span>{items.length}</span></h3>
            {items.length ? items.map((order) => (
              <article className="mini-card" key={order.id}>
                <strong>{order.id} - {order.product}</strong>
                <span>{order.client}</span>
                <span>{order.origin} -&gt; {order.destination}</span>
                <span>{order.tons} ton - {dateLabel(order.pickup)}</span>
              </article>
            )) : <p className="client-meta">Sem cargas neste status.</p>}
          </div>
        );
      })}
    </div>
  );
}

function Timeline({ orders }: { orders: FreightOrder[] }) {
  return (
    <div className="timeline">
      {[...orders].sort((a, b) => a.pickup.localeCompare(b.pickup)).slice(0, 6).map((order) => (
        <article className="timeline-item" key={order.id}>
          <div className="timeline-date">{dateLabel(order.pickup)}</div>
          <div>
            <strong>{order.origin} -&gt; {order.destination}</strong>
            <span className="client-meta">{order.client} - {order.product} - {order.status}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function Clients({ clients, onNewClient }: { clients: Client[]; onNewClient: () => void }) {
  return (
    <section>
      <div className="section-head">
        <h2>Carteira de clientes</h2>
        <button className="secondary" type="button" onClick={onNewClient}>+ Cliente</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contato</th>
              <th>Origem recorrente</th>
              <th>Produto</th>
              <th>Risco</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={`${client.name}-${client.origin}`}>
                <td><strong>{client.name}</strong></td>
                <td>{client.contact}</td>
                <td>{client.origin}</td>
                <td>{client.product}</td>
                <td><span className={`badge ${normalize(client.risk)}`}>{client.risk}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Orders({
  orders,
  priorityFilter,
  onPriorityFilter,
  onStatusChange
}: {
  orders: FreightOrder[];
  priorityFilter: "todas" | Priority;
  onPriorityFilter: (priority: "todas" | Priority) => void;
  onStatusChange: (id: string, status: FreightStatus) => void;
}) {
  return (
    <section>
      <div className="section-head">
        <h2>Ordens de carga</h2>
        <div className="segmented" role="group" aria-label="Filtro de prioridade">
          {["todas", "Alta", "Normal"].map((priority) => (
            <button key={priority} className={`segment ${priorityFilter === priority ? "active" : ""}`} type="button" onClick={() => onPriorityFilter(priority as "todas" | Priority)}>
              {priority === "todas" ? "Todas" : priority}
            </button>
          ))}
        </div>
      </div>
      <div className="cards-grid">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div>
              <strong>{order.id} - {order.product}</strong>
              <span className="order-meta">{order.client}</span>
            </div>
            <span className="order-meta">{order.origin} -&gt; {order.destination}</span>
            <span className="order-meta">{order.tons} toneladas - coleta {dateLabel(order.pickup)}</span>
            <div className="order-footer">
              <span className={`badge ${normalize(order.priority)}`}>{order.priority}</span>
              <select className="status-select" value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value as FreightStatus)}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Quotes({ orders }: { orders: FreightOrder[] }) {
  const [result, setResult] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const revenue = Number(form.get("km")) * Number(form.get("rate")) + Number(form.get("extra"));
    const cost = revenue * 0.76;
    setResult(`${currency(revenue)} - margem estimada ${currency(revenue - cost)}`);
  }

  return (
    <section>
      <div className="section-head">
        <h2>Cotacoes e margem</h2>
      </div>
      <div className="quote-layout">
        <form className="quote-calculator" onSubmit={submit}>
          <h3>Simular frete</h3>
          <label>Distancia km<input name="km" type="number" defaultValue="420" min="1" /></label>
          <label>Peso ton<input name="ton" type="number" defaultValue="32" min="1" step="0.1" /></label>
          <label>R$ por km<input name="rate" type="number" defaultValue="8.2" min="0" step="0.1" /></label>
          <label>Custo extra<input name="extra" type="number" defaultValue="450" min="0" step="10" /></label>
          <button className="primary" type="submit">Calcular</button>
          <output>{result}</output>
        </form>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Carga</th>
                <th>Cliente</th>
                <th>Receita</th>
                <th>Custo</th>
                <th>Margem</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.id}</strong><span className="client-meta">{order.origin} -&gt; {order.destination}</span></td>
                  <td>{order.client}</td>
                  <td>{currency(order.revenue)}</td>
                  <td>{currency(order.cost)}</td>
                  <td><strong>{currency(order.revenue - order.cost)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Drivers({ orders }: { orders: FreightOrder[] }) {
  return (
    <section>
      <div className="section-head">
        <h2>Viagens, motoristas e veiculos</h2>
      </div>
      <div className="driver-board">
        {orders.map((order) => (
          <article className="driver-card" key={order.id}>
            <div>
              <strong>{order.driver}</strong>
              <span className="client-meta">{order.vehicle}</span>
            </div>
            <span className="client-meta">{order.id} - {order.origin} -&gt; {order.destination}</span>
            <div className="progress" aria-label={`Progresso ${order.progress}%`}><span style={{ width: `${order.progress}%` }} /></div>
            <span className="badge">{order.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function Finance({ orders }: { orders: FreightOrder[] }) {
  const cards = [
    ["A faturar", orders.filter((order) => order.status !== "Faturado").reduce((sum, order) => sum + order.revenue, 0), "Fretes aprovados, em cotacao ou em execucao"],
    ["Faturado", orders.filter((order) => order.status === "Faturado").reduce((sum, order) => sum + order.revenue, 0), "Receita ja concluida"],
    ["Custos previstos", orders.reduce((sum, order) => sum + order.cost, 0), "Motorista, diesel, pedagio e extras"],
    ["Resultado bruto", orders.reduce((sum, order) => sum + order.revenue - order.cost, 0), "Receita menos custos diretos"]
  ] as const;

  return (
    <section>
      <div className="section-head">
        <h2>Financeiro</h2>
      </div>
      <div className="finance-grid">
        {cards.map(([label, value, helper]) => (
          <article className="finance-card" key={label}>
            <span className="client-meta">{label}</span>
            <strong>{currency(value)}</strong>
            <p className="client-meta">{helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function OrderModal({ nextId, onClose, onCreate }: { nextId: number; onClose: () => void; onCreate: (order: FreightOrder) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tons = Number(form.get("tons"));
    const revenue = Math.round(tons * 390 + 1800);
    const cost = Math.round(revenue * 0.78);
    const status = form.get("status") as FreightStatus;

    onCreate({
      id: `FR-${nextId}`,
      client: String(form.get("client")),
      product: String(form.get("product")),
      origin: String(form.get("origin")),
      destination: String(form.get("destination")),
      tons,
      pickup: String(form.get("pickup")),
      priority: form.get("priority") as Priority,
      status,
      revenue,
      cost,
      driver: "A definir",
      vehicle: "A definir",
      progress: progressForStatus(status)
    });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <form className="modal-form" onSubmit={submit}>
        <div className="modal-head">
          <h2>Nova carga</h2>
          <button className="ghost modal-close" type="button" onClick={onClose} title="Fechar">x</button>
        </div>
        <div className="form-grid">
          <label>Cliente<input name="client" required placeholder="Fazenda Boa Safra" /></label>
          <label>Produto<input name="product" required placeholder="Soja" /></label>
          <label>Origem<input name="origin" required placeholder="Sorriso, MT" /></label>
          <label>Destino<input name="destination" required placeholder="Santos, SP" /></label>
          <label>Peso ton<input name="tons" type="number" min="1" step="0.1" required defaultValue="30" /></label>
          <label>Coleta<input name="pickup" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
          <label>Prioridade
            <select name="priority" defaultValue="Normal">
              <option>Normal</option>
              <option>Alta</option>
            </select>
          </label>
          <label>Status
            <select name="status" defaultValue="Cotacao">
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>
        <button className="primary full" type="submit">Salvar carga</button>
      </form>
    </div>
  );
}

function ClientModal({ onClose, onCreate }: { onClose: () => void; onCreate: (client: Client) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onCreate({
      name: String(form.get("name")),
      contact: String(form.get("contact")),
      origin: String(form.get("origin")),
      product: String(form.get("product")),
      risk: form.get("risk") as Client["risk"]
    });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <form className="modal-form" onSubmit={submit}>
        <div className="modal-head">
          <h2>Novo cliente</h2>
          <button className="ghost modal-close" type="button" onClick={onClose} title="Fechar">x</button>
        </div>
        <div className="form-grid">
          <label>Cliente<input name="name" required /></label>
          <label>Contato<input name="contact" required /></label>
          <label>Cidade origem<input name="origin" required /></label>
          <label>Produto principal<input name="product" required /></label>
          <label>Risco
            <select name="risk" defaultValue="Baixo">
              <option>Baixo</option>
              <option>Medio</option>
              <option>Alto</option>
            </select>
          </label>
        </div>
        <button className="primary full" type="submit">Salvar cliente</button>
      </form>
    </div>
  );
}

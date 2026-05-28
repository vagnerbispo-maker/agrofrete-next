export function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dateLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function normalize(value: unknown) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function progressForStatus(status: string) {
  const progress: Record<string, number> = {
    Cotacao: 10,
    Aprovado: 28,
    "Em transito": 65,
    Entregue: 100,
    Faturado: 100
  };

  return progress[status] ?? 10;
}

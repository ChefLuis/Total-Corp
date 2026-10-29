export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Painel Inicial</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Receita Hoje</h3>
          <p className="text-2xl font-semibold text-slate-900 mt-2">R$ 0,00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Agendamentos</h3>
          <p className="text-2xl font-semibold text-slate-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Ocupação</h3>
          <p className="text-2xl font-semibold text-slate-900 mt-2">0%</p>
        </div>
      </div>
    </div>
  );
}
